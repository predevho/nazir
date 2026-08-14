# 나지르 — 방문자 대시보드 설계

작성일: 2026-08-14
상태: 확정 (구현 대기)

## 목표

공개 사이트의 **순 방문자**를 익명 쿠키 기준으로 집계해, 관리자 허브(`/admin`)에
**오늘 방문자 · 총 방문자 · 최근 7일 추세**를 대시보드로 표시한다.

## 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 집계 기준 | 순 방문자 — 익명 first-party 쿠키(uuid), 하루 1인 1카운트 |
| "총 방문자" | 순 방문자 **누적**(distinct visitor_id, 사람 수) |
| 구현 방식 | 자체 Supabase 카운터(비콘 → 라우트 핸들러 → RPC) |
| 표시 | `/admin` 허브 상단 스탯 타일 2개 + 최근 7일 미니 막대 |
| 기준일 | **KST**(`now() at time zone 'Asia/Seoul'`)로 "오늘" 계산 |
| 관리자 방문 | `(site)` 레이아웃 밖이라 자동 제외 |
| 개인정보 | 익명 랜덤 쿠키만. IP·PII 미저장. 쿠키 동의 배너 없음 |

## 데이터 모델

### 마이그레이션 `supabase/migrations/0005_visits.sql`

```sql
-- 방문자 집계(순 방문자, 하루 1인 1행). 직접 접근은 막고 함수로만 기록/조회.
create table if not exists visits (
  visitor_id text not null,
  visited_on date not null,
  primary key (visitor_id, visited_on)
);
alter table visits enable row level security;
-- 정책 없음 → anon/authenticated 직접 select/insert 불가. 아래 SECURITY DEFINER 함수로만 접근.

-- 방문 기록: 오늘(KST) 기준 (visitor_id, 오늘) upsert, 중복 무시.
create or replace function record_visit(p_visitor_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 or length(p_visitor_id) > 64 then
    return; -- 형식 이상값 무시
  end if;
  insert into visits (visitor_id, visited_on)
  values (p_visitor_id, (now() at time zone 'Asia/Seoul')::date)
  on conflict (visitor_id, visited_on) do nothing;
end;
$$;
revoke all on function record_visit(text) from public;
grant execute on function record_visit(text) to anon, authenticated;

-- 통계: 오늘·총(distinct)·최근 7일(0 포함) json 반환. 관리자만.
create or replace function get_visit_stats()
returns json
language sql
security definer
set search_path = public
as $$
  with today as (select (now() at time zone 'Asia/Seoul')::date as d)
  select json_build_object(
    'today', (select count(*) from visits, today where visited_on = today.d),
    'total', (select count(distinct visitor_id) from visits),
    'last7', (
      select coalesce(json_agg(json_build_object('day', to_char(gs.d, 'MM-DD'), 'count', coalesce(c.cnt, 0)) order by gs.d), '[]'::json)
      from (
        select ((select d from today) - g)::date as d
        from generate_series(6, 0, -1) as g
      ) gs
      left join (
        select visited_on, count(*) as cnt from visits group by visited_on
      ) c on c.visited_on = gs.d
    )
  );
$$;
revoke all on function get_visit_stats() from public;
grant execute on function get_visit_stats() to authenticated;
```

> 배포 Supabase 대시보드 SQL Editor에서 **1회** 실행. `create ... if not exists` / `create or replace`로 재실행 안전.
> gen_random_uuid 등 확장 불필요(쿠키 uuid는 클라이언트 생성).

## 아키텍처

### 방문 기록 흐름 (ISR 캐시 대응)

공개 페이지는 ISR로 캐시되어 서버 렌더가 매 방문마다 실행되지 않으므로,
**클라이언트 비콘**으로 실제 브라우저 로드를 집계한다.

**`components/VisitBeacon.tsx`** (클라이언트)
- 마운트 시 1회: 쿠키 `nz_vid` 읽기 → 없으면 `crypto.randomUUID()` 생성 후 쿠키 설정(1년, `SameSite=Lax`, `path=/`).
- `fetch('/api/visit', { method: 'POST', body: JSON.stringify({ visitorId }) })` (실패 무시, keepalive).
- 순수 헬퍼 `getOrCreateVisitorId(cookieString, gen): { id: string; setCookie: string | null }` 로 쿠키 로직을 분리(테스트 대상). setCookie가 non-null이면 `document.cookie`에 기록.

**`app/(site)/layout.tsx`**
- 공개 레이아웃에 `<VisitBeacon />` 마운트. 관리자(`/admin`)는 이 레이아웃 밖이라 제외.

**`app/api/visit/route.ts`** (POST)
- body에서 `visitorId` 파싱. 문자열·길이(8~64) 검증 실패 시 무시하고 200 반환.
- 쿠키리스 anon Supabase 클라이언트(`lib/supabase.ts`의 createServerClient)로 `rpc('record_visit', { p_visitor_id: visitorId })` 호출.
- 항상 204/200 반환(집계 실패가 사용자 경험을 막지 않음).

### 통계 조회·표시

**`lib/visits.ts`**
- 타입 `VisitStats = { today: number; total: number; last7: { day: string; count: number }[] }`.
- `getVisitStats(): Promise<VisitStats | null>` — 관리자용. `@supabase/ssr` 서버 클라이언트로 `rpc('get_visit_stats')` 호출, 실패 시 null.
- 순수 헬퍼 `barHeights(last7, maxPx): number[]` — 최대값 기준 정규화한 막대 높이(px). 전부 0이면 모두 최소 높이. 테스트 대상.

**`app/admin/page.tsx`**
- 상단(관리자 인사말 아래)에 대시보드 섹션 추가:
  - 스탯 타일 2개: **오늘 방문자**(`today`), **총 방문자**(`total`).
  - 최근 7일 미니 막대(`last7`) — `barHeights`로 높이 계산, 각 막대 아래 `day` 라벨.
- `getVisitStats()`가 null이면(미마이그레이션 등) "집계 준비 중" 안내만 표시하고 나머지 관리 메뉴는 정상.

## 데이터 흐름

```
[방문자] 공개 페이지 로드
  → VisitBeacon: nz_vid 쿠키 확보 → POST /api/visit
  → route handler → rpc record_visit(visitor_id) → visits upsert(오늘KST)

[관리자] /admin
  → getVisitStats() → rpc get_visit_stats() → {today,total,last7}
  → 스탯 타일 + 7일 막대 렌더
```

## 에러 처리 / 엣지

- 비콘 fetch 실패 → 조용히 무시(사용자 영향 없음).
- 잘못된 visitorId(길이/형식) → 함수·핸들러에서 무시.
- 통계 RPC 실패(미적용 등) → 대시보드 자리에 "집계 준비 중"만, 관리자 기능 정상.
- SPA 내비게이션: `(site)` 레이아웃은 재마운트되지 않아 비콘은 풀로드당 1회. DB upsert가 하루 단위 중복을 흡수.
- 봇: JS 미실행으로 대부분 제외.

## 보안 / 개인정보

- `visits` 테이블 RLS on + 직접 정책 없음 → 오직 SECURITY DEFINER 함수로만 접근.
- `record_visit`는 anon 실행 허용(비로그인 방문자 기록). `get_visit_stats`는 authenticated만.
- 저장 데이터: 익명 쿠키 uuid + 날짜뿐. IP·User-Agent·PII 미저장.
- 집계 조작(무작위 id 대량 삽입) 가능성은 있으나 허영 지표이므로 수용. 길이 검증으로 최소 방어.

## 테스트

- `lib/visits.test.ts`
  - `getOrCreateVisitorId`: 쿠키에 nz_vid 있으면 그 값 반환·setCookie null; 없으면 생성값 반환·setCookie 문자열(nz_vid=…, Max-Age, SameSite 포함).
  - `barHeights`: 최대값이 maxPx, 비례 축소, 전부 0이면 최소 높이, 빈 배열 처리.
- DB 함수·비콘 네트워크·RPC는 통합 영역이라 단위 테스트 제외.
- 기존 전체 테스트 유지, `npm test`·`npm run build` 통과.

## 범위 밖 (YAGNI)

- 페이지별·유입경로·지역·기기 분석.
- 실시간 갱신, 기간 필터.
- 쿠키 동의 배너.
- Vercel Web Analytics 연동.

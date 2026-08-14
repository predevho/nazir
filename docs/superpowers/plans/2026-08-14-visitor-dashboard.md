# 방문자 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 사이트의 순 방문자(익명 쿠키)를 Supabase에 집계해 관리자 허브에 오늘·총 방문자와 최근 7일 추세를 표시한다.

**Architecture:** 공개 레이아웃의 클라이언트 비콘이 익명 쿠키 id로 `POST /api/visit` → 라우트 핸들러가 `record_visit` RPC 호출. 관리자 허브는 `get_visit_stats` RPC로 집계를 읽어 렌더. 순수 로직(쿠키 id·막대 높이)은 `lib/visits.ts`로 분리해 테스트한다.

**Tech Stack:** Next.js 16(App Router, Route Handler), React 19, TypeScript, Tailwind v3, Supabase(RPC/RLS), Vitest.

---

## 파일 구조

- Create: `supabase/migrations/0005_visits.sql` — visits 테이블 + record_visit/get_visit_stats 함수
- Create: `lib/visits.ts` — 순수 헬퍼(getOrCreateVisitorId, barHeights) + 타입 VisitStats (클라이언트 안전)
- Create: `lib/visits.test.ts` — 순수 헬퍼 테스트
- Create: `components/VisitBeacon.tsx` — 클라이언트 비콘
- Create: `app/api/visit/route.ts` — POST 기록 핸들러
- Create: `app/admin/visitStats.ts` — 서버 전용 getVisitStats
- Modify: `app/(site)/layout.tsx` — VisitBeacon 마운트
- Modify: `app/admin/page.tsx` — 대시보드 렌더
- Modify: `README.md`

---

## Task 1: 마이그레이션 0005 (visits 테이블 + 함수)

**Files:**
- Create: `supabase/migrations/0005_visits.sql`

- [ ] **Step 1: 마이그레이션 작성**

`supabase/migrations/0005_visits.sql`:

```sql
-- 방문자 집계(순 방문자, 하루 1인 1행). 직접 접근은 막고 함수로만 기록/조회.
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. create if not exists / or replace로 재실행 안전.
create table if not exists visits (
  visitor_id text not null,
  visited_on date not null,
  primary key (visitor_id, visited_on)
);
alter table visits enable row level security;
-- 정책 없음 → anon/authenticated 직접 접근 불가. 아래 SECURITY DEFINER 함수로만.

-- 방문 기록: 오늘(KST) 기준 (visitor_id, 오늘) upsert, 중복 무시.
create or replace function record_visit(p_visitor_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 or length(p_visitor_id) > 64 then
    return;
  end if;
  insert into visits (visitor_id, visited_on)
  values (p_visitor_id, (now() at time zone 'Asia/Seoul')::date)
  on conflict (visitor_id, visited_on) do nothing;
end;
$$;
revoke all on function record_visit(text) from public;
grant execute on function record_visit(text) to anon, authenticated;

-- 통계: 오늘·총(distinct)·최근 7일(0 포함) json. 관리자만.
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

- [ ] **Step 2: 커밋**

```bash
git add supabase/migrations/0005_visits.sql
git commit -m "feat: 방문자 집계 테이블·함수 마이그레이션(0005)"
```

> 배포 Supabase에 수동 적용 필요. 구현 중 실제 DB에 적용하지 말 것.

---

## Task 2: 순수 헬퍼 `lib/visits.ts` (TDD)

**Files:**
- Create: `lib/visits.ts`
- Test: `lib/visits.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/visits.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getOrCreateVisitorId, barHeights } from './visits';

describe('getOrCreateVisitorId', () => {
  it('쿠키에 nz_vid가 있으면 그 값을 쓰고 setCookie는 null', () => {
    const r = getOrCreateVisitorId('a=1; nz_vid=abc123xyz; b=2', () => 'NEW');
    expect(r).toEqual({ id: 'abc123xyz', setCookie: null });
  });
  it('없으면 생성값을 쓰고 setCookie 문자열을 만든다', () => {
    const r = getOrCreateVisitorId('', () => 'GEN-UUID-VALUE');
    expect(r.id).toBe('GEN-UUID-VALUE');
    expect(r.setCookie).toContain('nz_vid=GEN-UUID-VALUE');
    expect(r.setCookie).toContain('SameSite=Lax');
    expect(r.setCookie).toContain('Max-Age=');
  });
});

describe('barHeights', () => {
  it('최대값이 maxPx가 되도록 비례 축소, 0은 최소 높이', () => {
    expect(barHeights([{ day: '01', count: 0 }, { day: '02', count: 5 }, { day: '03', count: 10 }], 40)).toEqual([2, 20, 40]);
  });
  it('전부 0이면 모두 최소 높이', () => {
    expect(barHeights([{ day: '01', count: 0 }, { day: '02', count: 0 }], 40)).toEqual([2, 2]);
  });
  it('빈 배열은 빈 결과', () => {
    expect(barHeights([], 40)).toEqual([]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/visits.test.ts`
Expected: FAIL — 모듈/함수 미정의.

- [ ] **Step 3: 구현**

`lib/visits.ts`:

```typescript
export type VisitStats = {
  today: number;
  total: number;
  last7: { day: string; count: number }[];
};

const COOKIE_NAME = 'nz_vid';
const BAR_MIN_PX = 2;

/** 쿠키 문자열에서 방문자 id를 얻거나 새로 만든다. 새로 만들면 setCookie 문자열을 함께 반환. */
export function getOrCreateVisitorId(
  cookieString: string,
  gen: () => string
): { id: string; setCookie: string | null } {
  const existing = cookieString
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (existing) {
    return { id: existing.slice(COOKIE_NAME.length + 1), setCookie: null };
  }
  const id = gen();
  const setCookie = `${COOKIE_NAME}=${id}; Max-Age=31536000; Path=/; SameSite=Lax`;
  return { id, setCookie };
}

/** 최근 데이터 막대 높이(px). 최대값이 maxPx, 0은 최소 높이. */
export function barHeights(last7: { day: string; count: number }[], maxPx: number): number[] {
  const max = Math.max(0, ...last7.map((d) => d.count));
  if (max === 0) return last7.map(() => BAR_MIN_PX);
  return last7.map((d) => (d.count === 0 ? BAR_MIN_PX : Math.max(BAR_MIN_PX, Math.round((d.count / max) * maxPx))));
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/visits.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/visits.ts lib/visits.test.ts
git commit -m "feat: 방문자 순수 헬퍼(getOrCreateVisitorId·barHeights) 추가"
```

---

## Task 3: 방문 기록 경로 (비콘 + 라우트 + 레이아웃 마운트)

**Files:**
- Create: `components/VisitBeacon.tsx`
- Create: `app/api/visit/route.ts`
- Modify: `app/(site)/layout.tsx`

- [ ] **Step 1: 비콘 컴포넌트 작성**

`components/VisitBeacon.tsx`:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { getOrCreateVisitorId } from '@/lib/visits';

/** 공개 페이지 로드 시 1회 방문 비콘 전송. 실패는 조용히 무시. */
export function VisitBeacon() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const { id, setCookie } = getOrCreateVisitorId(document.cookie, () => crypto.randomUUID());
    if (setCookie) document.cookie = setCookie;
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId: id }),
      keepalive: true,
    }).catch(() => {});
  }, []);
  return null;
}
```

- [ ] **Step 2: 라우트 핸들러 작성**

`app/api/visit/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { visitorId } = await req.json();
    if (typeof visitorId === 'string' && visitorId.length >= 8 && visitorId.length <= 64) {
      const supabase = createServerClient();
      if (supabase) await supabase.rpc('record_visit', { p_visitor_id: visitorId });
    }
  } catch {
    // 집계 실패는 무시(사용자 경험 우선)
  }
  return new NextResponse(null, { status: 204 });
}
```

- [ ] **Step 3: 공개 레이아웃에 비콘 마운트**

`app/(site)/layout.tsx`의 import에 추가:

```tsx
import { VisitBeacon } from '@/components/VisitBeacon';
```

`<Curtain />` 아래(또는 fragment 내부 아무 곳)에 `<VisitBeacon />` 추가:

```tsx
    <>
      <VisitBeacon />
      <Curtain />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer site={site} />
    </>
```

- [ ] **Step 4: 타입체크·빌드**

Run: `npx tsc --noEmit && npm run build`
Expected: 타입 에러 없음, 빌드 성공(`/api/visit` 라우트 확인).

- [ ] **Step 5: 커밋**

```bash
git add components/VisitBeacon.tsx app/api/visit/route.ts "app/(site)/layout.tsx"
git commit -m "feat: 방문 비콘·기록 라우트 추가 및 공개 레이아웃 마운트"
```

---

## Task 4: 관리자 대시보드 (통계 조회 + 렌더)

**Files:**
- Create: `app/admin/visitStats.ts`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: 서버 전용 getVisitStats 작성**

`app/admin/visitStats.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import type { VisitStats } from '@/lib/visits';

/** 관리자용 방문 통계. 미적용/오류 시 null. */
export async function getVisitStats(): Promise<VisitStats | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_visit_stats');
    if (error || !data) return null;
    return data as VisitStats;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: 관리자 허브에 대시보드 추가**

`app/admin/page.tsx` 상단 import에 추가:

```tsx
import { getVisitStats } from './visitStats';
import { barHeights } from '@/lib/visits';
```

`if (!user) redirect('/admin/login');` 다음에 데이터 로드 추가:

```tsx
  const stats = await getVisitStats();
  const heights = stats ? barHeights(stats.last7, 44) : [];
```

`<p className="text-sm text-paper/60 mb-8">로그인됨: ...</p>` 바로 다음에 대시보드 블록 삽입:

```tsx
      {stats ? (
        <div className="mb-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-gold/25 bg-velvet rounded-sm p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">오늘 방문자</span>
              <p className="font-display text-[clamp(28px,6vw,40px)] text-gold mt-1">{stats.today.toLocaleString()}</p>
            </div>
            <div className="border border-gold/25 bg-velvet rounded-sm p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">총 방문자</span>
              <p className="font-display text-[clamp(28px,6vw,40px)] text-gold mt-1">{stats.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 border border-gold/15 bg-velvet/60 rounded-sm p-4">
            <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">최근 7일</span>
            <div className="flex items-end gap-2 h-[52px] mt-2">
              {stats.last7.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gold/70 rounded-sm" style={{ height: `${heights[i]}px` }} title={`${d.day}: ${d.count}`} />
                  <span className="font-mono text-[9px] text-paper/40">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-paper/50 mb-8">방문자 집계 준비 중입니다.</p>
      )}
```

- [ ] **Step 3: 전체 테스트·타입체크·빌드**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: 전부 PASS, 타입 에러 없음, 빌드 성공.

- [ ] **Step 4: 커밋**

```bash
git add app/admin/visitStats.ts app/admin/page.tsx
git commit -m "feat: 관리자 허브에 방문자 대시보드(오늘·총·7일) 추가"
```

---

## Task 5: README 갱신

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README에 기능·마이그레이션 반영**

`README.md`에 다음을 반영(기존 스타일):
- 관리자 설명에 "방문자 대시보드(오늘·총 방문자·최근 7일)" 추가.
- 마이그레이션 목록에 `0005_visits.sql`(방문자 집계 테이블·함수, 배포 Supabase 수동 적용) 추가.
- 로드맵에 "방문자 대시보드 (완료)" 한 줄 추가.
- 집계 방식(익명 쿠키 비콘, IP·PII 미저장, 관리자 방문 제외) 한 줄 명시.

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs: 방문자 대시보드 반영 및 0005 안내"
```

---

## 최종 검증

- [ ] `npx vitest run` — 기존 54개 + 신규(visits 5) 전부 PASS
- [ ] `npx tsc --noEmit` — 타입 에러 없음
- [ ] `npm run build` — 빌드 성공(`/api/visit` 라우트 포함)
- [ ] 배포 Supabase에 `0005_visits.sql` 수동 적용 안내(적용 전엔 대시보드가 "집계 준비 중" 표시)
- [ ] (선택) 적용 후 프로덕션에서 공개 페이지 방문 → `/admin` 허브에 오늘 1 이상 표시 확인

> 개발 서버(next dev)는 서브에이전트가 띄우지 말 것. 확인은 `rm -rf .next && npm run build && npx next start -p 3100`.
> ⚠️ 0005는 컬럼 조회를 강제하지 않으므로(신규 테이블), 미적용 상태로 배포해도 기존 콘텐츠 폴백은 없음. 대시보드만 "집계 준비 중"으로 표시됨.

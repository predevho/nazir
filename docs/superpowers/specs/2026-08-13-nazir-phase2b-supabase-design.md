# 〈나지르〉 Phase 2B — Supabase 콘텐츠 이관 설계 문서

- 작성일: 2026-08-13
- 상태: 승인됨 (구현 계획 단계로 진행)
- 선행: Phase 2A(Next.js 16 App Router 전환) 완료 · `main` @ cceeb1b
- 관련: `2026-08-13-nazir-phase2-nextjs-supabase-design.md`(상위 설계), `2026-08-13-nazir-website-design.md`(전체 §4)

## 1. 목적 · 범위

Phase 2A에서 페이지는 이미 서버 컴포넌트로 `await getContent()`를 호출한다. 2B는
`lib/content.ts`의 데이터 출처를 **로컬 데이터 → Supabase**로 바꾼다. 자격증명이
없으면 로컬 데이터로 자동 폴백하므로, 사용자가 Supabase를 준비하기 전에도 사이트와
테스트가 정상 동작한다.

### 범위 포함
- Supabase 스키마 마이그레이션 SQL + 시드 SQL 작성
- `@supabase/supabase-js` 서버 읽기 클라이언트(쿠키리스, anon key)
- `getContent()` Supabase 우선 + 로컬 폴백
- 페이지 ISR(`revalidate = 60`)
- `.env.local` 규약, `.env.example` 커밋

### 범위 제외 (Phase 3)
- 관리자 로그인·편집·사진 업로드, `@supabase/ssr` 쿠키/세션, on-demand revalidation
- 실제 사진 업로드(2B에서 `photo_url`은 null, `images` 버킷만 생성)

### 사용자 협조 필요
- supabase.com에서 프로젝트 생성(무료 티어)
- 대시보드 SQL Editor에 마이그레이션·시드 SQL 적용(또는 Supabase CLI)
- `.env.local`에 프로젝트 URL·anon key 입력
- (제약) 이 세션에서는 Supabase MCP 미인증이라 제가 DB에 직접 적용/조회 불가. 코드·SQL만 작성.

## 2. 렌더링 · 캐싱

- 각 페이지(`app/page.tsx`, `about`, `process`, `join`)에 `export const revalidate = 60` 추가 → **ISR**.
- 방문자는 캐시된 정적 페이지를 받고, 관리자 수정은 최대 ~60초 내 반영.
- Phase 3에서 관리자 저장 시 on-demand revalidation을 얹으면 즉시 반영 가능.

## 3. Supabase 클라이언트

- 라이브러리: **`@supabase/supabase-js`**.
- `lib/supabase.ts` — 서버에서 anon key로 읽기 전용 클라이언트 생성(쿠키 없음 → ISR 캐싱 가능).
- 환경변수 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 둘 다 있을 때만 클라이언트 생성. 하나라도 없으면 `null` 반환(폴백 신호).
- `@supabase/ssr`(쿠키·세션)은 Phase 3 관리자 인증에서 도입.

## 4. 데이터 모델 (마이그레이션 SQL)

id는 Phase 1 로컬 데이터와 동일한 문자열을 사용해 시드가 1:1로 매핑되게 한다.

| 테이블 | 컬럼 | 비고 |
|--------|------|------|
| `content_blocks` | `key text pk`, `value text not null`, `updated_at timestamptz default now()` | SiteContent의 문자열 필드(heroVerse, synopsis, accountNumber, supportFormUrl 등 ~24개). key = 필드명 |
| `facts` | `id text pk`, `key text`, `value text`, `sort_order int` | 작품 개요(SiteContent.facts) |
| `characters` | `id text pk`, `name text`, `description text`, `photo_url text`, `sort_order int`, `updated_at` | 인물 6 |
| `timeline_events` | `id text pk`, `period text`, `title text`, `status text`, `sort_order int`, `updated_at` | status ∈ {완료, 진행 중, 예정} (check 제약) |
| `budget_items` | `id text pk`, `name text`, `sort_order int`, `updated_at` | 예산 항목 8 |
| `prayers` | `id text pk`, `text text`, `sort_order int`, `updated_at` | 기도제목 6 |
| `people_groups` | `id text pk`, `label text`, `sort_order int` | 헤더진/팀원/배우 |
| `people_members` | `id text pk`, `group_id text references people_groups(id)`, `text text`, `sort_order int` | 그룹별 멤버 |

- Storage 버킷 `images`(public read). 사진 업로드는 Phase 3.
- **RLS**: 모든 테이블 RLS 활성화 + `anon`/`authenticated` **select 허용** 정책. insert/update/delete 정책은 `authenticated`만(관리자 전용, Phase 3에서 사용). Storage `images`도 공개 read.

## 5. `getContent()` 조립 로직

```
getContent():
  client = createServerClient()  // env 없으면 null
  if client == null: return localContent   // 폴백
  try:
    [blocks, facts, characters, timeline, budget, prayers, groups, members] = await 병렬 조회(정렬 포함)
    site = mapBlocksToSiteContent(blocks) + { facts }
    people = groups.map(g => { ...g, members: members.filter(group_id==g.id) })
    return { site, characters, timeline, budget, prayers, people }
  catch:
    return localContent   // 조회 실패 시 폴백
```
- 반환 타입은 Phase 1과 동일한 `AllContent` → 페이지·컴포넌트 변경 없음.
- `content_blocks` → SiteContent 매핑: key가 SiteContent 필드명과 일치. 누락 키는 로컬 기본값으로 보완(선택) 또는 빈 문자열.

## 6. SQL · 파일 배치

- `supabase/migrations/0001_init.sql` — 테이블·인덱스·RLS·Storage 버킷 생성.
- `supabase/seed.sql` — 현재 `content/data.ts` 값 삽입(재실행 가능: `insert ... on conflict (id/key) do update`).
- 한글 텍스트를 SQL에 정확히 이스케이프(작은따옴표 처리).
- 적용: 사용자가 대시보드 SQL Editor에 순서대로 붙여넣기(migration → seed).

## 7. 환경변수

- `.env.local`(gitignore): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `.env.example`(커밋): 위 두 키의 빈 템플릿 + 주석.

## 8. 테스트

- **폴백 경로**: env 없으면 `getContent()`가 로컬 데이터를 반환 → 기존 테스트가 그대로 통과(자격증명·네트워크 불필요). CI/개발 기본 경로.
- **조립 로직**: Supabase 클라이언트를 목(mock)으로 대체해, 가짜 행 집합이 올바른 `AllContent`(개수·정렬·people 중첩·site.facts)로 조립되는지 검증.
- 페이지 테스트(`await Page()`)는 폴백 경로로 계속 통과.

## 9. 검증 전략

- 제가 작성한 코드·SQL은 **폴백 경로**(테스트·빌드)와 **조립 로직 목 테스트**로 검증.
- 실제 Supabase 모드는 사용자가 SQL 적용 + `.env.local` 설정 후 확인(문서에 확인 절차 명시).

## 10. 진행 순서 요약

1. `@supabase/supabase-js` 도입 + `lib/supabase.ts`(쿠키리스 서버 클라이언트, env 없으면 null)
2. `getContent()`를 Supabase 우선 + 로컬 폴백으로 교체(+ 조립 로직) + 목 테스트
3. 페이지에 `revalidate = 60`(ISR)
4. `supabase/migrations/0001_init.sql`(스키마·RLS·버킷) 작성
5. `supabase/seed.sql`(현재 콘텐츠) 작성
6. `.env.example` + 적용/설정 안내(README/문서)
7. 전체 테스트·빌드 검증

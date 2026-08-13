# 〈나지르〉 Phase 2B — Supabase 이관 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `getContent()`의 데이터 출처를 로컬 → Supabase로 바꾸되, 자격증명이 없으면 로컬로 자동 폴백한다. 페이지·컴포넌트는 그대로.

**Architecture:** `lib/supabase.ts`가 env가 있을 때만 쿠키리스 anon 클라이언트를 만든다(없으면 null). `getContent()`는 클라이언트가 있으면 Supabase에서 행을 읽어 순수 함수 `assembleContent()`로 `AllContent`를 조립하고, 없거나 실패하면 로컬 데이터를 반환한다. 페이지는 `revalidate = 60`(ISR).

**Tech Stack:** Next.js 16 App Router, `@supabase/supabase-js`, TypeScript, Vitest.

**핵심 결정**
- 공개 읽기만(2B) → 쿠키리스 `@supabase/supabase-js`. `@supabase/ssr`는 Phase 3.
- id는 Phase 1 로컬 데이터와 동일 문자열 → 시드 1:1.
- 커밋 메시지 한글 + 타입 접두사.
- **제약**: 이 세션에서 실제 Supabase에 SQL 적용/조회 불가. 코드·SQL 작성 + 폴백 경로/조립 목 테스트로 검증. 실제 Supabase 모드는 사용자가 SQL 적용 + `.env.local` 설정 후 확인.

**전제:** `main`(cceeb1b) = 동작하는 Next.js 앱. 작업은 새 브랜치.

---

## File Structure

| 경로 | 상태 | 책임 |
|------|------|------|
| `lib/supabase.ts` | 신규 | env 있을 때만 anon 서버 클라이언트 생성(없으면 null) |
| `lib/content.ts` | 수정 | Supabase 우선 + 로컬 폴백, `assembleContent()` 추가 |
| `lib/content.test.ts` | 수정/추가 | 폴백 + `assembleContent` 조립 검증 |
| `app/page.tsx`,`app/about/page.tsx`,`app/process/page.tsx`,`app/join/page.tsx` | 수정 | `export const revalidate = 60` 추가 |
| `supabase/migrations/0001_init.sql` | 신규 | 스키마·RLS·Storage 버킷 |
| `supabase/seed.sql` | 신규 | 현재 콘텐츠 시드(upsert) |
| `.env.example` | 신규 | env 템플릿 |
| `.gitignore` | 수정 | `.env*.local` 무시 확인 |
| `README.md` | 수정 | Supabase 설정·적용 안내 |

---

## Task 1: Supabase 클라이언트 도입

**Files:** Create `lib/supabase.ts`; Modify `package.json`(deps). 검증: `npm run build`, `npx tsc --noEmit`

- [ ] **Step 1: 설치**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 2: `lib/supabase.ts` 작성**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * 서버 전용 읽기 클라이언트. env가 모두 있을 때만 생성하고, 없으면 null(로컬 폴백 신호).
 * 공개(anon) 읽기만 하므로 세션을 유지하지 않는다(ISR 캐싱 가능).
 */
export function createServerClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 3: 빌드/타입 확인**

Run: `npm run build`
Expected: 성공(아직 사용처 없음, 컴파일만 확인).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Supabase 서버 읽기 클라이언트 추가(env 없으면 폴백)"
```

---

## Task 2: getContent Supabase 우선 + 폴백 + 조립 로직

**Files:** Modify `lib/content.ts`, `lib/content.test.ts`. 검증: `npm test`

- [ ] **Step 1: 조립/폴백 테스트 작성 (TDD)**

`lib/content.test.ts`를 아래로 교체(기존 폴백 테스트 유지 + 조립 테스트 추가):
```ts
import { describe, it, expect } from 'vitest';
import { getContent, assembleContent } from './content';

describe('getContent (폴백 경로)', () => {
  it('env가 없으면 로컬 데이터를 반환한다', async () => {
    const data = await getContent();
    expect(data.characters).toHaveLength(6);
    expect(data.site.accountNumber).toBe('3333-23-3584437');
  });
});

describe('assembleContent', () => {
  it('행 집합을 AllContent로 조립한다(정렬·people 중첩·site 병합 포함)', () => {
    const result = assembleContent({
      blocks: [
        { key: 'accountNumber', value: '1234-56-7890' },
        { key: 'heroSubtitle', value: '구별된 사람들' },
      ],
      facts: [{ id: 'f1', key: 'FORM', value: '창작 뮤지컬', sort_order: 0 }],
      characters: [
        { id: 'b', name: '한나', description: '설명B', photo_url: null, sort_order: 1 },
        { id: 'a', name: '아론', description: '설명A', photo_url: 'http://img/a.jpg', sort_order: 0 },
      ],
      timeline: [{ id: 't0', period: '26.01', title: '대본', status: '완료', sort_order: 0 }],
      budget: [{ id: 'b0', name: '기획', sort_order: 0 }],
      prayers: [{ id: 'p0', text: '기도1', sort_order: 0 }],
      groups: [
        { id: 'g1', label: '팀원', sort_order: 1 },
        { id: 'g0', label: '헤더진', sort_order: 0 },
      ],
      members: [
        { id: 'g0m0', group_id: 'g0', text: '연출 정은수', sort_order: 0 },
        { id: 'g1m0', group_id: 'g1', text: '기획팀', sort_order: 0 },
      ],
    });
    // content_blocks 병합
    expect(result.site.accountNumber).toBe('1234-56-7890');
    // facts는 테이블에서
    expect(result.site.facts).toEqual([{ key: 'FORM', value: '창작 뮤지컬' }]);
    // 정렬(sort_order)
    expect(result.characters.map((c) => c.name)).toEqual(['아론', '한나']);
    expect(result.characters[0].photoUrl).toBe('http://img/a.jpg');
    // people 그룹 정렬 + 멤버 중첩
    expect(result.people.map((g) => g.label)).toEqual(['헤더진', '팀원']);
    expect(result.people[0].members[0].text).toBe('연출 정은수');
  });

  it('content_blocks에 없는 site 필드는 로컬 기본값으로 채운다', () => {
    const result = assembleContent({
      blocks: [], facts: [], characters: [], timeline: [], budget: [], prayers: [], groups: [], members: [],
    });
    // 로컬 기본값(예: heroSubtitle)이 유지됨
    expect(result.site.heroSubtitle).toBe('구별된 사람들');
  });
});
```

- [ ] **Step 2: 테스트 실행(실패 확인)**

Run: `npm test lib/content.test.ts`
Expected: FAIL(`assembleContent` 미존재).

- [ ] **Step 3: `lib/content.ts` 작성**

```ts
import { content as localContent } from '../content/data';
import type { AllContent, SiteContent, TimelineStatus } from '../content/types';
import { createServerClient } from './supabase';

// Supabase 원시 행 타입(스네이크케이스)
type Rows = {
  blocks: { key: string; value: string }[];
  facts: { id: string; key: string; value: string; sort_order: number }[];
  characters: { id: string; name: string; description: string; photo_url: string | null; sort_order: number }[];
  timeline: { id: string; period: string; title: string; status: string; sort_order: number }[];
  budget: { id: string; name: string; sort_order: number }[];
  prayers: { id: string; text: string; sort_order: number }[];
  groups: { id: string; label: string; sort_order: number }[];
  members: { id: string; group_id: string; text: string; sort_order: number }[];
};

const byOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

/** 순수 함수: 원시 행 → AllContent. content_blocks는 로컬 site 위에 병합(누락 키는 로컬 기본값). */
export function assembleContent(rows: Rows): AllContent {
  const blocksMap = Object.fromEntries(rows.blocks.map((b) => [b.key, b.value]));
  const site: SiteContent = {
    ...localContent.site,
    ...blocksMap,
    facts: [...rows.facts].sort(byOrder).map((f) => ({ key: f.key, value: f.value })),
  };
  return {
    site,
    characters: [...rows.characters].sort(byOrder).map((c) => ({
      id: c.id, name: c.name, description: c.description, photoUrl: c.photo_url, sortOrder: c.sort_order,
    })),
    timeline: [...rows.timeline].sort(byOrder).map((t) => ({
      id: t.id, period: t.period, title: t.title, status: t.status as TimelineStatus, sortOrder: t.sort_order,
    })),
    budget: [...rows.budget].sort(byOrder).map((b) => ({ id: b.id, name: b.name, sortOrder: b.sort_order })),
    prayers: [...rows.prayers].sort(byOrder).map((p) => ({ id: p.id, text: p.text, sortOrder: p.sort_order })),
    people: [...rows.groups].sort(byOrder).map((g) => ({
      id: g.id, label: g.label, sortOrder: g.sort_order,
      members: rows.members.filter((m) => m.group_id === g.id).sort(byOrder).map((m) => ({
        id: m.id, text: m.text, sortOrder: m.sort_order,
      })),
    })),
  };
}

/** Supabase 우선, 미설정/실패 시 로컬 폴백. */
export async function getContent(): Promise<AllContent> {
  const client = createServerClient();
  if (!client) return localContent;
  try {
    const [blocks, facts, characters, timeline, budget, prayers, groups, members] = await Promise.all([
      client.from('content_blocks').select('key,value'),
      client.from('facts').select('id,key,value,sort_order'),
      client.from('characters').select('id,name,description,photo_url,sort_order'),
      client.from('timeline_events').select('id,period,title,status,sort_order'),
      client.from('budget_items').select('id,name,sort_order'),
      client.from('prayers').select('id,text,sort_order'),
      client.from('people_groups').select('id,label,sort_order'),
      client.from('people_members').select('id,group_id,text,sort_order'),
    ]);
    const err = blocks.error || facts.error || characters.error || timeline.error || budget.error || prayers.error || groups.error || members.error;
    if (err) throw err;
    return assembleContent({
      blocks: blocks.data ?? [], facts: facts.data ?? [], characters: characters.data ?? [],
      timeline: timeline.data ?? [], budget: budget.data ?? [], prayers: prayers.data ?? [],
      groups: groups.data ?? [], members: members.data ?? [],
    });
  } catch {
    return localContent;
  }
}
```
참고: `import` 경로는 기존 `lib/content.ts`와 동일하게 `../content/*` 상대경로 사용(현재 파일 위치 `lib/`).

- [ ] **Step 4: 테스트 실행(통과 확인)**

Run: `npm test lib/content.test.ts`
Expected: PASS(폴백 + 조립 3케이스).

- [ ] **Step 5: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과. Run: `npm run build` → 성공.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: getContent를 Supabase 우선+로컬 폴백으로 교체하고 조립 로직 추가"
```

---

## Task 3: 페이지 ISR

**Files:** Modify `app/page.tsx`, `app/about/page.tsx`, `app/process/page.tsx`, `app/join/page.tsx`. 검증: `npm run build`

- [ ] **Step 1: 각 페이지에 revalidate 추가**

4개 페이지 각각의 `import` 아래(컴포넌트 정의 위)에 한 줄 추가:
```ts
export const revalidate = 60;
```
(다른 코드는 변경 없음.)

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: 성공. env가 없으므로 페이지는 로컬 데이터로 렌더되지만, ISR 설정이 붙는다(빌드 출력에서 라우트가 ISR/정적으로 표시). 오류 없어야 함.

- [ ] **Step 3: 전체 테스트**

Run: `npm test`
Expected: 여전히 전부 통과(페이지 테스트는 `await Page()` 폴백 경로).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 공개 페이지에 ISR(revalidate 60초) 적용"
```

---

## Task 4: 마이그레이션 SQL (스키마·RLS·Storage)

**Files:** Create `supabase/migrations/0001_init.sql`. (실행은 사용자가 대시보드에서.)

- [ ] **Step 1: `supabase/migrations/0001_init.sql` 작성**

```sql
-- 나지르 콘텐츠 스키마 · RLS · Storage (Phase 2B)
-- 대시보드 SQL Editor에 이 파일 전체를 붙여넣어 실행하세요.

-- ── 테이블 ─────────────────────────────────────────────
create table if not exists content_blocks (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

create table if not exists facts (
  id text primary key,
  key text not null,
  value text not null,
  sort_order int not null default 0
);

create table if not exists characters (
  id text primary key,
  name text not null,
  description text not null,
  photo_url text,
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists timeline_events (
  id text primary key,
  period text not null,
  title text not null,
  status text not null check (status in ('완료', '진행 중', '예정')),
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists budget_items (
  id text primary key,
  name text not null,
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists prayers (
  id text primary key,
  text text not null,
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists people_groups (
  id text primary key,
  label text not null,
  sort_order int not null default 0
);

create table if not exists people_members (
  id text primary key,
  group_id text not null references people_groups(id) on delete cascade,
  text text not null,
  sort_order int not null default 0
);

-- ── RLS: 공개 읽기, 쓰기는 인증 사용자(관리자, Phase 3) ──
-- 각 테이블: RLS 활성화 + 공개 select 정책 + 인증 사용자 전체(all) 정책.
-- 재실행 시 정책 중복 오류를 피하려고 drop policy if exists를 먼저 둔다.
alter table content_blocks   enable row level security;
alter table facts            enable row level security;
alter table characters       enable row level security;
alter table timeline_events  enable row level security;
alter table budget_items     enable row level security;
alter table prayers          enable row level security;
alter table people_groups    enable row level security;
alter table people_members   enable row level security;

drop policy if exists "public read"  on content_blocks;
drop policy if exists "auth write"    on content_blocks;
create policy "public read" on content_blocks for select using (true);
create policy "auth write"  on content_blocks for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on facts;
drop policy if exists "auth write"    on facts;
create policy "public read" on facts for select using (true);
create policy "auth write"  on facts for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on characters;
drop policy if exists "auth write"    on characters;
create policy "public read" on characters for select using (true);
create policy "auth write"  on characters for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on timeline_events;
drop policy if exists "auth write"    on timeline_events;
create policy "public read" on timeline_events for select using (true);
create policy "auth write"  on timeline_events for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on budget_items;
drop policy if exists "auth write"    on budget_items;
create policy "public read" on budget_items for select using (true);
create policy "auth write"  on budget_items for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on prayers;
drop policy if exists "auth write"    on prayers;
create policy "public read" on prayers for select using (true);
create policy "auth write"  on prayers for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on people_groups;
drop policy if exists "auth write"    on people_groups;
create policy "public read" on people_groups for select using (true);
create policy "auth write"  on people_groups for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on people_members;
drop policy if exists "auth write"    on people_members;
create policy "public read" on people_members for select using (true);
create policy "auth write"  on people_members for all to authenticated using (true) with check (true);

-- ── Storage: 공개 이미지 버킷(사진 업로드는 Phase 3) ──
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "public read images" on storage.objects;
drop policy if exists "auth write images" on storage.objects;
create policy "public read images"
  on storage.objects for select
  using (bucket_id = 'images');
create policy "auth write images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images');
```
이 스크립트는 `if not exists` / `drop policy if exists` / `on conflict` 를 써서 **재실행 가능**하다.

- [ ] **Step 2: 스키마-타입 정합성 self-check(수동)**

`content/types.ts`의 필드와 대조: `characters.photo_url`↔`photoUrl`, `*.sort_order`↔`sortOrder`, `timeline_events.status` 체크 제약이 `TimelineStatus`('완료'/'진행 중'/'예정')와 일치하는지 확인.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: Supabase 스키마·RLS·Storage 마이그레이션 SQL 추가"
```

---

## Task 5: 시드 SQL (현재 콘텐츠)

**Files:** Create `supabase/seed.sql`. 원본: `content/data.ts`(값을 정확히 옮김).

- [ ] **Step 1: `content/data.ts`를 읽고 `supabase/seed.sql` 생성**

규칙:
- 각 테이블에 `insert ... values ... on conflict (<pk>) do update set ...` (재실행 가능).
- 문자열의 작은따옴표 `'`는 `''`로 이스케이프(대부분 곡선따옴표 “” ‘’ 라 이스케이프 불필요하나 반드시 확인).
- `content_blocks`: `content/data.ts`의 `content.site`에서 **facts를 제외한 모든 문자열 필드**를 `(key, value)`로. key는 필드명 그대로(`heroVerse`, `heroMeta`, `accountNumber`, `supportFormUrl` 등). `heroMeta`의 줄바꿈은 SQL 문자열 안에 실제 개행(또는 `E'...\n...'`)으로 보존.
- `facts`: `content.site.facts` 5개 → `(id, key, value, sort_order)`. id는 `f0..f4`.
- `characters`/`timeline`/`budget`/`prayers`/`people_groups`/`people_members`: `content/data.ts`의 배열을 그대로. id·sort_order는 데이터의 값(`aron`, `t0`, `b0`, `p0`, `g0`, `g0m0` …)과 동일하게.

형식 예(구조만 — 실제 값은 data.ts에서):
```sql
-- content_blocks
insert into content_blocks (key, value) values
  ('heroSubtitle', '구별된 사람들'),
  ('accountNumber', '3333-23-3584437')
  -- … site의 나머지 문자열 필드 전부 …
on conflict (key) do update set value = excluded.value, updated_at = now();

-- heroMeta(줄바꿈 포함)
insert into content_blocks (key, value) values
  ('heroMeta', E'2027 창작뮤지컬 · 제작 PRAYSOUND\n연출 정은수 · 2027.01–02 예정')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- facts
insert into facts (id, key, value, sort_order) values
  ('f0', 'FORM', '창작 뮤지컬', 0)
  -- … f1..f4 …
on conflict (id) do update set key = excluded.key, value = excluded.value, sort_order = excluded.sort_order;

-- characters
insert into characters (id, name, description, photo_url, sort_order) values
  ('aron', '아론', '신앙과 재능 모두 …', null, 0)
  -- … 나머지 5명 …
on conflict (id) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;

-- timeline_events / budget_items / prayers / people_groups / people_members 동일 패턴
```

- [ ] **Step 2: 개수·정합성 self-check**

seed의 각 테이블 행 수가 `content/data.ts`와 일치하는지 확인: characters 6, timeline 20, budget 8, prayers 6, people_groups 3, people_members(헤더진 3 + 팀원 9 + 배우 2 = 총합 확인), facts 5, content_blocks = site의 문자열 필드 수(facts 제외).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: 현재 콘텐츠 시드 SQL 추가(재실행 가능 upsert)"
```

---

## Task 6: 환경변수 · 안내 문서

**Files:** Create `.env.example`; Modify `.gitignore`, `README.md`.

- [ ] **Step 1: `.env.example` 작성**

```bash
# Supabase 공개(anon) 설정 — supabase.com 프로젝트의 Project Settings > API 에서 복사
# 실제 값은 .env.local 에 넣으세요(.env.local 은 git에 커밋되지 않습니다).
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

- [ ] **Step 2: `.gitignore`에 env 무시 확인/추가**

`.gitignore`에 아래가 없으면 추가:
```
# env
.env
.env*.local
```

- [ ] **Step 3: `README.md`에 Supabase 설정 절 추가**

"## Supabase 연결(선택)" 절을 추가:
- 자격증명이 없으면 사이트는 로컬 데이터로 동작(폴백).
- 연결 방법: (1) supabase.com에서 프로젝트 생성 → (2) 대시보드 SQL Editor에 `supabase/migrations/0001_init.sql` 실행 → (3) `supabase/seed.sql` 실행 → (4) `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력 → (5) `npm run dev`.
- 로드맵 Phase 2B를 (완료)로, Phase 3 예정 표기.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: Supabase 환경변수 템플릿과 연결 안내 추가"
```

---

## Task 7: 전체 검증

**Files:** 없음(검증만).

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과(폴백 + 조립 테스트 포함).
Run: `npm run build` → 성공. `.env.local`이 없으므로 로컬 폴백으로 렌더됨(정상).

- [ ] **Step 2: 폴백 동작 육안 확인**

`npm run dev`로 `/`·`/about`·`/process`·`/join`이 로컬 데이터로 정상 렌더되는지 확인(자격증명 없이). 확인 후 종료.

- [ ] **Step 3: 커밋 확인**

`git log --oneline main..HEAD` 로 2B 커밋들이 한글+타입 접두사인지 확인.

---

## 후속 (별도 계획)

- 사용자가 Supabase 프로젝트 생성 → migration/seed SQL 적용 → `.env.local` 설정 → Supabase 모드 확인(콘텐츠가 DB에서 옴).
- **Phase 3** — 관리자 로그인(`@supabase/ssr` 쿠키/세션 + 미들웨어), 편집 UI, 사진 업로드(Storage `images`), 저장 시 on-demand revalidation.

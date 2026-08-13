# 〈나지르〉 Phase 3B-1 — 관리자 셸 + 단일 문구 편집 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** route group으로 관리자 전용 셸을 만들고, `/admin/content`에서 단일 문구(content_blocks)를 편집·저장하면 공개 페이지에 즉시 반영되게 한다.

**Architecture:** 공개 페이지는 `(site)` 그룹(공개 chrome), 루트 레이아웃은 최소, `/admin`은 자체 셸. 편집 폼은 `useActionState` + 서버 액션 `saveContent`(로그인 세션으로 content_blocks upsert → `revalidatePath('/', 'layout')`).

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr`, React 19(useActionState), TypeScript, Vitest.

**핵심 결정**
- 편집 대상은 content_blocks(SiteContent 문자열 필드 26개). 목록은 3B-2.
- 저장은 로그인 세션 + RLS "auth write"(service_role 미사용). 편집은 Supabase 연결 상태에서만.
- 커밋 메시지 한글 + 타입 접두사.
- **제약**: 실제 저장 왕복은 로그인 후 확인. 여기서는 폼/설정 렌더 테스트 + 액션 로직(목) + 빌드 + 공개 페이지 회귀로 검증.

**전제:** `main`(d4735c6) = 동작하는 Next.js 앱, Supabase 연결·관리자 로그인 됨. 작업은 새 브랜치.

---

## File Structure

| 경로 | 상태 | 책임 |
|------|------|------|
| `app/layout.tsx` | 수정 | 최소 루트(html·폰트·body·metadata) |
| `app/(site)/layout.tsx` | 신규 | 공개 셸(Curtain·Header·main·Footer) |
| `app/(site)/page.tsx` 등 | 이동 | 공개 페이지 4종 + 테스트 → `(site)`로 |
| `app/admin/layout.tsx` | 신규 | 관리자 셸(상단바) |
| `app/admin/page.tsx` | 수정 | 허브(편집 링크 + 로그아웃) |
| `lib/adminFields.ts` | 신규 | 필드 설정(라벨·섹션·multiline) |
| `lib/adminFields.test.ts` | 신규 | 필드 완성도 테스트 |
| `app/admin/content/page.tsx` | 신규 | 편집 화면(서버, 현재 값 로드) |
| `app/admin/content/ContentEditForm.tsx` | 신규 | 편집 폼(클라이언트, useActionState) |
| `app/admin/content/ContentEditForm.test.tsx` | 신규 | 폼 렌더 테스트 |
| `app/admin/content/actions.ts` | 신규 | `saveContent` 서버 액션 |
| `app/admin/content/actions.test.ts` | 신규 | 저장 액션 로직(목) |

---

## Task 1: route group 분리 (관리자 셸)

**Files:** Modify `app/layout.tsx`; Create `app/(site)/layout.tsx`, `app/admin/layout.tsx`; Move 공개 페이지. 검증: `npm run build`, `npm test`

- [ ] **Step 1: 공개 페이지를 `(site)` 그룹으로 이동(git mv)**

```bash
mkdir -p "app/(site)"
git mv app/page.tsx "app/(site)/page.tsx"
git mv app/page.test.tsx "app/(site)/page.test.tsx"
git mv app/about "app/(site)/about"
git mv app/process "app/(site)/process"
git mv app/join "app/(site)/join"
```
(route group `(site)`는 URL에 영향 없음. 페이지들은 `@/` 별칭 import라 이동해도 유효. 테스트는 `./page` 상대 import라 함께 이동돼 유효.)

- [ ] **Step 2: `app/layout.tsx`를 최소 루트로 교체**

```tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '나지르 · 구별된 사람들',
  description: '창작 뮤지컬 〈나지르〉 — 구별된 사람들. 제작 PRAYSOUND.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-stage text-paper min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: `app/(site)/layout.tsx` 신규(공개 셸)**

```tsx
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Curtain } from '@/components/Curtain';
import { getContent } from '@/lib/content';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getContent();
  return (
    <>
      <Curtain />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer site={site} />
    </>
  );
}
```

- [ ] **Step 4: `app/admin/layout.tsx` 신규(관리자 셸)**

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-gold/15 px-5 py-4">
        <span className="font-display text-lg text-gold">나지르</span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-paper/40 ml-2">ADMIN</span>
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 5: 빌드 + 테스트 확인**

Run: `npm run build` → 성공. 라우트 목록에 `/`, `/about`, `/process`, `/join`(변화 없음), `/admin`, `/admin/login` 표시.
Run: `npm test` → 기존 테스트 모두 통과(공개 페이지 테스트는 이동됐지만 통과 유지). 커튼은 이제 `(site)`에서만 렌더됨(그 테스트는 그대로 통과).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: route group으로 공개 셸과 관리자 셸 분리"
```

---

## Task 2: 필드 설정 (lib/adminFields.ts)

**Files:** Create `lib/adminFields.ts`, `lib/adminFields.test.ts`. 검증: `npm test`

- [ ] **Step 1: 완성도 테스트 작성 (TDD)**

`lib/adminFields.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { ADMIN_FIELDS } from './adminFields';
import { content } from '@/content/data';

describe('ADMIN_FIELDS', () => {
  it('SiteContent의 문자열 필드(facts 제외)를 정확히 모두 덮는다', () => {
    const siteKeys = Object.keys(content.site).filter((k) => k !== 'facts').sort();
    const fieldKeys = ADMIN_FIELDS.map((f) => f.key).sort();
    expect(fieldKeys).toEqual(siteKeys);
  });
  it('키 중복이 없다', () => {
    const keys = ADMIN_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: 테스트 실행(실패 확인)**

Run: `npm test lib/adminFields.test.ts`
Expected: FAIL(모듈 없음).

- [ ] **Step 3: `lib/adminFields.ts` 작성**

```ts
import type { SiteContent } from '@/content/types';

export type AdminField = {
  key: keyof SiteContent & string;
  label: string;
  multiline?: boolean;
};

export type AdminSection = { title: string; fields: AdminField[] };

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    title: '히어로 (홈)',
    fields: [
      { key: 'heroVerse', label: '상단 성구', multiline: true },
      { key: 'heroSubtitle', label: '부제 (예: 구별된 사람들)' },
      { key: 'heroMeta', label: '제작 정보 (하단, 줄바꿈 가능)', multiline: true },
    ],
  },
  {
    title: '대하여',
    fields: [
      { key: 'aboutGreeting', label: '연출의 인사말', multiline: true },
      { key: 'praysoundStory1', label: 'Praysound 이야기 1', multiline: true },
      { key: 'praysoundStory2', label: 'Praysound 이야기 2', multiline: true },
      { key: 'logline', label: '로그라인', multiline: true },
      { key: 'synopsis', label: '시놉시스', multiline: true },
    ],
  },
  {
    title: '무대에 오르기까지',
    fields: [
      { key: 'processIntro', label: '안내 문구', multiline: true },
      { key: 'peopleIntro', label: '함께 세우는 사람들 안내', multiline: true },
      { key: 'budgetTotal', label: '제작 예산 총액 (예: ₩ 9,000,000)' },
      { key: 'budgetNote', label: '예산 안내 문구', multiline: true },
    ],
  },
  {
    title: '함께하기',
    fields: [
      { key: 'joinVerse', label: '성구', multiline: true },
      { key: 'joinVerseRef', label: '성구 출처 (예: 전도서 4:12)' },
      { key: 'supportIntro', label: '후원 안내 문구', multiline: true },
      { key: 'supportFormUrl', label: '후원 신청서 링크 (URL)' },
      { key: 'accountBank', label: '은행명' },
      { key: 'accountNumber', label: '계좌번호' },
      { key: 'accountHolder', label: '예금주 표기 (예: 예금주 정은수)' },
      { key: 'prayerIntro', label: '기도 안내 문구', multiline: true },
      { key: 'qnaIntro', label: 'Q&A 안내 문구', multiline: true },
      { key: 'qnaUrl', label: 'Q&A 링크 (URL)' },
    ],
  },
  {
    title: '푸터 · SNS',
    fields: [
      { key: 'instagramMain', label: '인스타그램 — Pray Sound (URL)' },
      { key: 'instagramMusical', label: '인스타그램 — 뮤지컬 나지르 (URL)' },
      { key: 'youtube', label: '유튜브 (URL)' },
      { key: 'contactInstagram', label: '문의 인스타그램 (URL)' },
    ],
  },
];

export const ADMIN_FIELDS: AdminField[] = ADMIN_SECTIONS.flatMap((s) => s.fields);
```
(주의: 여기 나열한 26개 key가 `content/data.ts`의 `content.site` 문자열 필드와 정확히 일치해야 테스트가 통과한다. 불일치 시 라벨이 아니라 key를 data.ts에 맞춘다.)

- [ ] **Step 4: 테스트 통과 + Commit**

Run: `npm test lib/adminFields.test.ts` → PASS.
```bash
git add -A
git commit -m "feat: 관리자 편집 필드 설정(라벨·섹션) 추가"
```

---

## Task 3: 편집 화면 + 저장 액션

**Files:** Create `app/admin/content/actions.ts`, `app/admin/content/ContentEditForm.tsx`, `app/admin/content/page.tsx`, `app/admin/content/ContentEditForm.test.tsx`, `app/admin/content/actions.test.ts`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: `app/admin/content/actions.ts` (저장 서버 액션)**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_FIELDS } from '@/lib/adminFields';

export type SaveState = { ok: boolean; message: string };

export async function saveContent(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const rows = ADMIN_FIELDS.map((f) => ({
    key: f.key,
    value: String(formData.get(f.key) ?? ''),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('content_blocks').upsert(rows);
  if (error) return { ok: false, message: `저장 실패: ${error.message}` };

  revalidatePath('/', 'layout');
  return { ok: true, message: '저장되었습니다. 공개 페이지에 반영됩니다.' };
}
```

- [ ] **Step 2: `app/admin/content/ContentEditForm.tsx` (클라이언트 폼)**

```tsx
'use client';
import { useActionState } from 'react';
import { ADMIN_SECTIONS } from '@/lib/adminFields';
import { saveContent, type SaveState } from './actions';

const initial: SaveState = { ok: false, message: '' };

export function ContentEditForm({ values }: { values: Record<string, string> }) {
  const [state, formAction, pending] = useActionState(saveContent, initial);
  return (
    <form action={formAction} className="flex flex-col gap-10">
      {ADMIN_SECTIONS.map((section) => (
        <fieldset key={section.title} className="flex flex-col gap-4 border-0 m-0 p-0">
          <legend className="font-display text-xl text-gold mb-2">{section.title}</legend>
          {section.fields.map((f) => (
            <label key={f.key} className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] tracking-[0.12em] text-paper/60">{f.label}</span>
              {f.multiline ? (
                <textarea
                  name={f.key}
                  defaultValue={values[f.key] ?? ''}
                  rows={3}
                  className="px-3.5 py-2.5 bg-velvet border border-gold/25 rounded-sm text-paper text-sm focus:border-gold/60 outline-none resize-y"
                />
              ) : (
                <input
                  type="text"
                  name={f.key}
                  defaultValue={values[f.key] ?? ''}
                  className="min-h-[44px] px-3.5 bg-velvet border border-gold/25 rounded-sm text-paper text-sm focus:border-gold/60 outline-none"
                />
              )}
            </label>
          ))}
        </fieldset>
      ))}
      <div className="flex items-center gap-4 sticky bottom-0 bg-stage/90 backdrop-blur py-4">
        <button
          type="submit"
          disabled={pending}
          className="min-h-[48px] px-6 bg-gold text-ink font-body font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60"
        >
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.message && <span className={`text-sm ${state.ok ? 'text-gold' : 'text-red-400'}`}>{state.message}</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 3: `app/admin/content/page.tsx` (서버, 현재 값 로드)**

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContent } from '@/lib/content';
import { ContentEditForm } from './ContentEditForm';

export default async function ContentAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { site } = await getContent();
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(site)) {
    if (typeof v === 'string') values[k] = v;
  }

  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mb-2">단일 문구 편집</h1>
      <p className="text-sm text-paper/60 mb-8">저장하면 공개 페이지에 즉시 반영됩니다.</p>
      <ContentEditForm values={values} />
    </section>
  );
}
```

- [ ] **Step 4: 폼 렌더 테스트 `app/admin/content/ContentEditForm.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./actions', () => ({ saveContent: vi.fn() }));
import { ContentEditForm } from './ContentEditForm';

describe('ContentEditForm', () => {
  it('섹션 라벨과 값, 저장 버튼을 렌더한다', () => {
    render(<ContentEditForm values={{ accountNumber: '3333-23-3584437', synopsis: '테스트 시놉' }} />);
    expect(screen.getByText('계좌번호')).toBeInTheDocument();
    expect(screen.getByText('시놉시스')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3333-23-3584437')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: 저장 액션 로직 테스트 `app/admin/content/actions.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest';

const { getUser, upsert, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@nazir.local' } } }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
  revalidatePath: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, from: () => ({ upsert }) }),
}));

import { saveContent } from './actions';

describe('saveContent', () => {
  it('로그인 상태에서 upsert하고 revalidate 후 성공을 반환한다', async () => {
    const fd = new FormData();
    fd.set('accountNumber', '9999-99-9999');
    const res = await saveContent({ ok: false, message: '' }, fd);
    expect(upsert).toHaveBeenCalledOnce();
    const rows = upsert.mock.calls[0][0] as Array<{ key: string; value: string }>;
    expect(rows.find((r) => r.key === 'accountNumber')?.value).toBe('9999-99-9999');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.ok).toBe(true);
  });
});
```

- [ ] **Step 6: 테스트 통과 + 빌드**

Run: `npm test app/admin/content` → 폼·액션 테스트 PASS.
Run: `npm test` → 전체 통과.
Run: `npm run build` → 성공(`/admin/content` 라우트 생성).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: 단일 문구 편집 화면과 저장(즉시 반영) 서버 액션 추가"
```

---

## Task 4: /admin 허브

**Files:** Modify `app/admin/page.tsx`. 검증: `npm run build`

- [ ] **Step 1: `app/admin/page.tsx`를 허브로 교체**

```tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { emailToUsername } from '@/lib/adminUsername';
import { logout } from './actions';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mb-2">관리자</h1>
      <p className="text-sm text-paper/60 mb-8">로그인됨: {emailToUsername(user.email ?? '')}</p>
      <div className="grid gap-3 mb-10">
        <Link
          href="/admin/content"
          className="border border-gold/25 bg-velvet rounded-sm p-5 hover:border-gold/55 transition-colors"
        >
          <span className="font-display text-lg text-gold">단일 문구 편집</span>
          <p className="text-sm text-paper/60 mt-1">인사말 · 시놉시스 · 공연 날짜 · 계좌 · 링크 등</p>
        </Link>
        <div className="border border-dashed border-gold/20 rounded-sm p-5 opacity-60">
          <span className="font-display text-lg text-paper/70">목록 편집 (인물 · 일정 · 명단)</span>
          <p className="text-sm text-paper/50 mt-1">다음 단계(3B-2)에서 추가됩니다.</p>
        </div>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="min-h-[44px] px-5 border border-gold/50 text-gold text-sm font-medium rounded-sm hover:bg-gold/[0.12] transition-colors"
        >
          로그아웃
        </button>
      </form>
    </section>
  );
}
```
(기존 `app/admin/actions.ts`의 `logout`은 그대로 사용.)

- [ ] **Step 2: 빌드 + Commit**

Run: `npm run build` → 성공.
```bash
git add -A
git commit -m "feat: 관리자 허브에 편집 링크와 로그아웃 구성"
```

---

## Task 5: 검증 · README

**Files:** Modify `README.md`. 검증만.

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과.
Run: `npm run build` → 성공. 라우트: 공개 4종(ISR 1m), `/admin`·`/admin/content`(동적), `/admin/login`, `ƒ Proxy`.

- [ ] **Step 2: README "관리자" 절 갱신**

- `/admin` 로그인 후 **단일 문구 편집**(`/admin/content`)에서 인사말·시놉시스·날짜·계좌·링크 등을 수정하고 저장하면 공개 페이지에 **즉시 반영**됨.
- 편집은 Supabase 연결 상태에서만 동작(미연결 시 로컬 데이터로 표시만, 저장 불가).
- 로드맵: Phase 3B-1(완료), 3B-2(목록 편집)·3C(사진) 예정.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: 관리자 단일 문구 편집 사용 안내 추가"
```

---

## 후속 (별도 계획)

- **Phase 3B-2** — 목록 편집(facts·characters·timeline·budget·prayers·people) 추가/수정/삭제/순서변경. 같은 저장·revalidate 패턴 재사용.
- **Phase 3C** — 사진 업로드(Storage `images`, `photo_url` 갱신).

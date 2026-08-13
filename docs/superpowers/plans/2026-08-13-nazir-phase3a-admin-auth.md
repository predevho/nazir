# 〈나지르〉 Phase 3A — 관리자 인증 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `@supabase/ssr` 쿠키 세션으로 관리자 로그인/로그아웃을 구현하고 `/admin` 경로를 미들웨어로 보호한다. 편집 UI(3B)·사진(3C)은 이후.

**Architecture:** `@supabase/ssr` 클라이언트 3종(브라우저/서버/미들웨어). `middleware.ts`가 `/admin/*`에서 세션을 갱신하고 미인증 시 `/admin/login`으로 리다이렉트. 공개 페이지(2B의 쿠키리스 ISR)는 그대로 유지(미들웨어 matcher를 `/admin`으로 한정).

**Tech Stack:** Next.js 16 App Router, `@supabase/ssr`, TypeScript, Vitest.

**핵심 결정**
- 관리자 계정은 Supabase 대시보드에서 생성(공개 가입 없음). env는 기존 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 재사용.
- 미들웨어 matcher `/admin/:path*` → 공개 페이지 ISR 영향 없음.
- 커밋 메시지 한글 + 타입 접두사.
- **제약**: 실제 로그인 왕복은 사용자가 관리자 계정을 만든 뒤 확인. 여기서는 코드 + 폼 렌더/구조 테스트 + 빌드로 검증.

**전제:** `main`(45f36b3) = 동작하는 Next.js 앱, Supabase 연결됨. 작업은 새 브랜치.

---

## File Structure

| 경로 | 상태 | 책임 |
|------|------|------|
| `lib/supabase/client.ts` | 신규 | 브라우저 클라이언트(`createBrowserClient`) |
| `lib/supabase/server.ts` | 신규 | 서버 클라이언트(쿠키 read/write, `await cookies()`) |
| `lib/supabase/middleware.ts` | 신규 | `updateSession` 유틸(세션 갱신 + `/admin` 보호) |
| `middleware.ts` | 신규 | 루트 미들웨어(matcher `/admin/:path*`) |
| `app/admin/login/page.tsx` | 신규 | 로그인 폼(클라이언트) |
| `app/admin/login/page.test.tsx` | 신규 | 폼 렌더 테스트 |
| `app/admin/page.tsx` | 신규 | 보호된 대시보드 자리(서버) |
| `app/admin/actions.ts` | 신규 | 로그아웃 서버 액션 |
| `components/Curtain.tsx` | 수정 | `/admin`에서는 커튼 미표시 |
| `lib/supabase.ts` | 변경 없음 | 2B 공개 읽기(쿠키리스) 유지 |

참고: 기존 `lib/supabase.ts`(2B, `createServerClient` 이름)와 새 `lib/supabase/server.ts`(`createClient` 이름)는 파일·함수명이 달라 충돌 없음. 공개 읽기는 계속 `lib/supabase.ts`를, 인증은 `lib/supabase/*`를 사용.

---

## Task 1: @supabase/ssr 클라이언트 헬퍼

**Files:** Create `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`; Modify `package.json`. 검증: `npm run build`

- [ ] **Step 1: 설치**

```bash
npm install @supabase/ssr
```

- [ ] **Step 2: `lib/supabase/client.ts` (브라우저)**

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: `lib/supabase/server.ts` (서버)**

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // 서버 컴포넌트에서 호출된 경우 — 미들웨어가 세션을 갱신하므로 무시 가능
          }
        },
      },
    }
  );
}
```

- [ ] **Step 4: `lib/supabase/middleware.ts` (세션 갱신 + 보호)**

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // createServerClient와 getUser() 사이에 다른 코드를 넣지 말 것(세션 랜덤 로그아웃 방지).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 페이지가 아닌데 미인증이면 로그인으로.
  if (!user && !request.nextUrl.pathname.startsWith('/admin/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 5: 빌드 확인 + Commit**

Run: `npm run build` → 성공(아직 미들웨어/페이지 없음, 헬퍼만 컴파일).
```bash
git add -A
git commit -m "feat: @supabase/ssr 클라이언트 헬퍼(브라우저·서버·미들웨어) 추가"
```

---

## Task 2: 루트 미들웨어(/admin 보호)

**Files:** Create `middleware.ts`. 검증: `npm run build` + 개발 서버 리다이렉트 확인

- [ ] **Step 1: `middleware.ts` 작성**

```ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
```

- [ ] **Step 2: 빌드 + 미들웨어 동작 확인**

Run: `npm run build` → 성공(빌드 출력에 `ƒ Middleware` 표시).
개발 서버로 확인: `npm run dev` 후 `/admin` 접속 → 미인증이므로 `/admin/login`으로 리다이렉트되는지 확인(로그인 페이지는 Task 3에서 만들지만, 리다이렉트 자체는 404 대상이라도 경로 변화로 확인 가능). 확인 후 종료.

주의(Next 16 규약): Next 16.3에서 루트 미들웨어 파일이 `middleware.ts`로 정상 동작해야 한다. 만약 빌드/실행에서 미들웨어가 인식되지 않거나 `proxy.ts`를 요구하는 경고가 나오면, 파일명을 `proxy.ts` + `export function proxy(...)`로 바꾸고 동일 `config.matcher`를 유지한다(내용 동일). 어느 쪽이든 `/admin` 미인증 리다이렉트가 실제로 동작하는 것을 확인할 것.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: /admin 경로를 보호하는 미들웨어 추가"
```

---

## Task 3: 로그인 페이지

**Files:** Create `app/admin/login/page.tsx`, `app/admin/login/page.test.tsx`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: 로그인 폼 테스트 작성 (TDD)**

`app/admin/login/page.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithPassword: vi.fn().mockResolvedValue({ error: null }) } }),
}));

import LoginPage from './page';

describe('LoginPage', () => {
  it('renders email/password fields and submit button', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행(실패 확인)**

Run: `npm test app/admin/login/page.test.tsx`
Expected: FAIL(page 없음).

- [ ] **Step 3: `app/admin/login/page.tsx` 작성**

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <section className="max-w-[400px] mx-auto px-5 py-[clamp(48px,9vw,88px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">ADMIN</p>
      <h1 className="font-display font-bold text-[clamp(26px,6vw,34px)] text-paper mb-8">관리자 로그인</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] tracking-[0.14em] text-paper/60">이메일</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-[48px] px-3.5 bg-velvet border border-gold/25 rounded-sm text-paper focus:border-gold/60 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] tracking-[0.14em] text-paper/60">비밀번호</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="min-h-[48px] px-3.5 bg-velvet border border-gold/25 rounded-sm text-paper focus:border-gold/60 outline-none"
          />
        </label>
        {error && <p className="text-[13px] text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="min-h-[52px] bg-gold text-ink font-body font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 통과 + 빌드**

Run: `npm test app/admin/login/page.test.tsx` → PASS.
Run: `npm run build` → 성공.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 관리자 로그인 페이지(이메일·비밀번호) 추가"
```

---

## Task 4: 대시보드 자리 + 로그아웃 + 커튼 가드

**Files:** Create `app/admin/page.tsx`, `app/admin/actions.ts`; Modify `components/Curtain.tsx`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: 로그아웃 서버 액션 `app/admin/actions.ts`**

```ts
'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
```

- [ ] **Step 2: `app/admin/page.tsx` (보호된 대시보드 자리, 서버 컴포넌트)**

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logout } from './actions';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(48px,9vw,88px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">ADMIN</p>
      <h1 className="font-display font-bold text-[clamp(26px,6vw,34px)] text-paper mb-2">관리자</h1>
      <p className="text-sm font-light text-paper/60 mb-8">로그인됨: {user.email}</p>
      <div className="border border-gold/20 bg-velvet rounded-sm p-5 mb-8">
        <p className="text-sm font-light text-paper/70">콘텐츠 편집 기능은 다음 단계(3B)에서 추가됩니다.</p>
      </div>
      <form action={logout}>
        <button type="submit" className="min-h-[48px] px-5 border border-gold/50 text-gold text-sm font-medium rounded-sm hover:bg-gold/[0.12] transition-colors">
          로그아웃
        </button>
      </form>
    </section>
  );
}
```

- [ ] **Step 3: `components/Curtain.tsx`에서 `/admin` 경로는 커튼 미표시**

파일 상단(이미 `'use client';`)에 `usePathname` import를 추가하고, `/admin`에서는 렌더하지 않도록 가드:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function Curtain() {
  const pathname = usePathname();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 1700);
    return () => clearTimeout(t);
  }, []);
  if (pathname.startsWith('/admin')) return null;
  if (!on) return null;
  return (
    <div data-testid="curtain" className="fixed inset-0 z-[200] pointer-events-none">
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#100B14] to-[#241A2E] animate-curtainL shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#100B14] to-[#241A2E] animate-curtainR shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
    </div>
  );
}
```
주의: 기존 `Curtain.test.tsx`는 `usePathname`을 쓰므로 목이 필요하다 — 테스트 상단에 `vi.mock('next/navigation', () => ({ usePathname: () => '/' }))`를 추가한다(경로 '/'이면 기존 동작 유지). 이 목 추가로 기존 커튼 테스트(1.8초 후 사라짐)가 계속 통과해야 한다.

- [ ] **Step 4: 테스트 + 빌드**

Run: `npm test` → 전부 통과(커튼 테스트 목 추가 반영).
Run: `npm run build` → 성공(`/admin`, `/admin/login` 라우트 생성).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: 관리자 대시보드 자리와 로그아웃 추가, /admin 커튼 미표시"
```

---

## Task 5: 검증 · 안내 문서

**Files:** Modify `README.md`. 검증만.

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과.
Run: `npm run build` → 성공. 라우트 목록에 `/admin`(동적), `/admin/login` 표시, `ƒ Middleware` 표시.

- [ ] **Step 2: README에 "관리자" 절 추가**

- 관리자 계정 생성: Supabase 대시보드 → Authentication → Users → Add user(이메일+비밀번호). 공개 가입은 사용 안 함(권장: Providers/Settings에서 Sign up 비활성화).
- 로그인: `/admin/login`에서 로그인 → `/admin` 대시보드. 로그아웃 버튼 제공.
- 편집·사진 기능은 다음 단계(3B/3C).

- [ ] **Step 3: (사용자 확인용) 로그인 왕복 안내**

README 또는 보고에 명시: 관리자 계정을 만든 뒤 `npm run dev` → `/admin` 접속 시 `/admin/login`으로 이동 → 로그인 → `/admin` 진입 → 로그아웃까지 확인.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: 관리자 로그인 사용 안내 추가"
```

---

## 후속 (별도 계획)

- **Phase 3B** — 콘텐츠 편집: `/admin`에서 단일 문구(content_blocks) 수정 + 목록(characters/timeline/budget/prayers/people) CRUD. 서버 액션 + 로그인 세션으로 RLS "auth write" 통과. 저장 시 `revalidatePath`로 즉시 반영. (이때 전용 admin 레이아웃/route group으로 공개 chrome 분리도 검토)
- **Phase 3C** — 사진 업로드: Storage `images` 버킷에 인물·팀 사진 업로드 후 `photo_url` 갱신.

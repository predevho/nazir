# 〈나지르〉 Phase 2A — Next.js 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1의 Vite + React SPA를 기능 변화 없이 Next.js(App Router)로 전환한다. 데이터는 아직 로컬(`content/data.ts`) 유지.

**Architecture:** 페이지는 **async 서버 컴포넌트**로 `await getContent()`를 호출한다. 인터랙티브 요소(계좌 복사·아코디언·커튼·스포트라이트·헤더 활성표시)만 `'use client'` 리프 컴포넌트로 둔다. 이렇게 하면 2B에서 `lib/content.ts` 내부만 Supabase 호출로 바꾸면 서버에서 데이터를 읽게 된다.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, **Tailwind CSS v3(유지)**, Vitest + React Testing Library

**핵심 결정**
- Tailwind는 **v3 유지** — Phase 1의 모든 클래스 문자열(`bg-gradient-to-*`, `animate-curtainL`, 토큰 색상 등)을 그대로 재사용. (v4는 후속 선택 과제)
- 디렉터리는 루트 기반(`app/`, `components/`, `content/`, `lib/`), import 별칭 `@/*` → 프로젝트 루트.
- 커밋 메시지는 한글 + 타입 접두사(`feat:`/`fix:`/`chore:`/`test:`/`docs:`).

**전제:** 현재 `main`(9c3f0b8)은 동작하는 Vite 앱. 작업은 새 브랜치에서.

---

## File Structure (전환 후)

| 경로 | 상태 | 책임 |
|------|------|------|
| `next.config.ts` | 신규 | Next 설정 |
| `tsconfig.json` | 교체 | Next용 TS 설정(+ `@/*` 별칭, next 플러그인) |
| `next-env.d.ts` | 자동생성 | Next 타입 |
| `postcss.config.js` | 유지 | tailwind + autoprefixer |
| `tailwind.config.ts` | 수정 | content 글롭을 app/components/content/lib로 |
| `app/globals.css` | 이동 | Phase 1 `src/index.css` |
| `app/layout.tsx` | 신규 | 루트 레이아웃(html lang=ko, 폰트, 메타, 헤더/푸터/커튼) |
| `app/page.tsx` | 신규 | 홈(서버) |
| `app/about/page.tsx` | 신규 | 대하여(서버) |
| `app/process/page.tsx` | 신규 | 무대에 오르기까지(서버) |
| `app/join/page.tsx` | 신규 | 함께하기(서버) |
| `components/*` | 이동 | `src/components/*` → 루트. Header는 클라이언트화, HeroBackdrop 신규 |
| `content/*`, `lib/content.ts` | 이동 | `src/content/*`, `src/lib/content.ts` |
| `lib/useContent.ts` | 삭제 | 서버 컴포넌트 전환으로 불필요 |
| `vitest.config.mts` | 신규 | Next용 Vitest 설정 |
| `vitest.setup.ts` | 신규 | jest-dom |
| 제거 | 삭제 | `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/components/Layout.tsx`(+test), `tsconfig.app.json`, `tsconfig.node.json`, `src/vite-env.d.ts` |

---

## Task 1: Next.js 도입 및 골격 부팅

**Files:** 제거·신규 다수(위 표). 검증: `npm run build`

- [ ] **Step 1: Next/React 설치, Vite 앱 엔트리 제거**

```bash
npm install next@latest react@^19 react-dom@^19
npm install -D @types/react@^19 @types/react-dom@^19
```
Vite 앱 전용 파일 삭제(테스트 하네스용 `vite`/`@vitejs/plugin-react`는 남겨둠 — Vitest가 사용):
```bash
rm -f vite.config.ts index.html src/main.tsx src/App.tsx src/App.test.tsx src/vite-env.d.ts tsconfig.app.json tsconfig.node.json
```

- [ ] **Step 2: `next.config.ts` 생성**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 3: `tsconfig.json` 교체 (Next 표준 + `@/*` 별칭)**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts", "**/*.test.tsx", "vitest.setup.ts", "vitest.config.mts"]
}
```
**설명:** 테스트 파일과 Vitest 설정은 `next build`의 타입 검사 대상에서 제외한다(Vitest가 별도로 트랜스파일·실행). 이렇게 하면 빌드가 테스트용 타입(jest-dom 매처 등)에 영향받지 않는다.

- [ ] **Step 4: `package.json` 스크립트 교체**

`"scripts"`를 다음으로:
```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Tailwind content 글롭 수정**

`tailwind.config.ts`의 `content`를:
```ts
content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
```
(색·폰트·keyframes·animation 정의는 그대로 둔다.)

- [ ] **Step 6: 전역 CSS 이동**

`src/index.css`를 `app/globals.css`로 이동(내용 그대로: `@tailwind base/components/utilities` + 전역 스타일 + `prefers-reduced-motion`).

- [ ] **Step 7: 최소 `app/layout.tsx` + `app/page.tsx`로 부팅 확인**

`app/layout.tsx`:
```tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```
`app/page.tsx`:
```tsx
export default function Home() {
  return <div className="bg-stage text-paper min-h-screen p-8 font-display text-4xl">나지르</div>;
}
```

- [ ] **Step 8: 빌드 확인**

Run: `npm run build`
Expected: `next build` 성공(첫 실행 시 `next-env.d.ts` 생성). Tailwind 클래스가 적용되는 CSS가 생성됨. 실패 시 오류 해결 후 재시도.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: Vite에서 Next.js(App Router)로 빌드 전환"
```

---

## Task 2: 소스 디렉터리 이관 (src → 루트)

**Files:** `src/components/*` → `components/*`, `src/content/*` → `content/*`, `src/lib/content.ts` → `lib/content.ts`, `src/test/setup.ts` → `vitest.setup.ts`. 삭제: `src/lib/useContent.ts`, `src/components/Layout.tsx`(+test), 남은 `src/`.

- [ ] **Step 1: 파일 이동 (git mv로 히스토리 보존)**

```bash
mkdir -p components content lib
git mv src/components/Accordion.tsx components/
git mv src/components/Accordion.test.tsx components/
git mv src/components/CopyButton.tsx components/
git mv src/components/CopyButton.test.tsx components/
git mv src/components/Curtain.tsx components/
git mv src/components/Curtain.test.tsx components/
git mv src/components/Footer.tsx components/
git mv src/components/Header.tsx components/
git mv src/components/Spotlight.tsx components/
git mv src/components/StatusChip.tsx components/
git mv src/content/types.ts content/
git mv src/content/types.test.ts content/
git mv src/content/data.ts content/
git mv src/content/data.test.ts content/
git mv src/lib/content.ts lib/
git mv src/lib/content.test.ts lib/
git mv src/test/setup.ts vitest.setup.ts
git rm src/lib/useContent.ts src/components/Layout.tsx src/components/Layout.test.tsx
git rm -r src/pages
```
`src/pages/*`(Phase 1 Vite 페이지와 그 테스트: Home/About/Process/Join)는 `app/*/page.tsx`로 대체되므로 위에서 삭제한다. 이후 남은 빈 `src/`가 있으면 삭제: `rm -rf src`.

**설명:** 컴포넌트들은 서로 상대경로(`../content/types`, `../content/data`)로 참조하는데, 그룹으로 함께 이동하므로 상대경로가 그대로 유효하다(`components/` ↔ `content/`는 여전히 형제). `lib/content.ts`의 `../content/data`도 유효. 별도 import 수정 불필요.

- [ ] **Step 2: 이동한 테스트의 setup 경로/데이터 테스트 확인**

`content/data.test.ts`, `content/types.test.ts`, `lib/content.test.ts`는 상대 import(`./data`, `./types`, `./content`)라 그대로 동작. `Accordion.test.tsx`/`CopyButton.test.tsx`/`Curtain.test.tsx`도 상대 import 유지.

- [ ] **Step 3: 빌드 확인(타입)**

Run: `npx tsc --noEmit`
Expected: 에러 없음(이동한 파일들이 컴파일됨). 에러가 있으면 경로만 조정.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: 소스 파일을 루트 디렉터리 구조로 이관"
```

---

## Task 3: 루트 레이아웃 + Header 클라이언트화

**Files:** Modify `app/layout.tsx`, `components/Header.tsx`, `components/Footer.tsx`(직접 site 받도록 이미 되어 있음), `components/Curtain.tsx`(디렉티브). Create nothing new besides edits.

- [ ] **Step 1: `components/Header.tsx`를 클라이언트 컴포넌트로 (next/link + usePathname)**

파일 최상단에 `'use client';` 추가하고, react-router 대신 next 사용:
```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { to: '/about', label: '대하여' },
  { to: '/process', label: '무대에 오르기까지' },
  { to: '/join', label: '함께하기' },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-[100] bg-stage/85 backdrop-blur-md border-b border-gold/15">
      <nav className="max-w-[1180px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2 text-paper shrink-0">
          <span className="font-display text-[22px] tracking-[0.06em] text-gold whitespace-nowrap">나지르</span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-paper/50 hidden sm:inline">NAZIR</span>
        </Link>
        <div className="flex gap-0.5 sm:gap-1">
          {items.map((it) => (
            <Link
              key={it.to}
              href={it.to}
              aria-current={pathname === it.to ? 'page' : undefined}
              className={`font-body text-[12px] sm:text-[13px] px-2 sm:px-2.5 py-2 rounded-md whitespace-nowrap transition-colors hover:text-gold hover:bg-gold/[0.08] ${pathname === it.to ? 'text-gold' : 'text-paper/70'}`}
            >
              {it.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: `components/Curtain.tsx`에 `'use client';` 추가**

파일 첫 줄에 `'use client';`를 넣는다(내용은 그대로: useState/useEffect로 1700ms 후 사라짐, `animate-curtainL/R`).

- [ ] **Step 3: `components/Footer.tsx` 확인**

훅이 없으므로 서버 컴포넌트로 그대로 사용 가능. 시그니처 `Footer({ site }: { site?: SiteContent })` 유지(import 경로 `../content/types` 유효). 변경 없음.

- [ ] **Step 4: `app/layout.tsx` 완성 (async 서버 레이아웃, 폰트·메타·헤더/푸터/커튼)**

```tsx
import './globals.css';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Curtain } from '@/components/Curtain';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: '나지르 · 구별된 사람들',
  description: '창작 뮤지컬 〈나지르〉 — 구별된 사람들. 제작 PRAYSOUND.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getContent();
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
      <body className="bg-stage text-paper min-h-screen overflow-x-hidden">
        <Curtain />
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer site={site} />
      </body>
    </html>
  );
}
```

- [ ] **Step 4b: 빌드 확인**

Run: `npm run build`
Expected: 성공(홈 placeholder + 레이아웃 렌더). 실패 시 해결.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: Next.js 루트 레이아웃과 next/link 기반 헤더 구성"
```

---

## Task 4: 홈 페이지 (서버 컴포넌트 + HeroBackdrop 클라이언트)

**Files:** Create `components/HeroBackdrop.tsx`; Modify `components/Spotlight.tsx`(디렉티브), `app/page.tsx`; Test `components/HeroBackdrop.test.tsx`, `app/page.test.tsx`.

- [ ] **Step 1: `components/Spotlight.tsx`에 `'use client';` 추가**

파일 첫 줄에 `'use client';`(내용은 그대로: `useSpotlight` 훅, window pointermove, spot/beam ref 반환).

- [ ] **Step 2: `components/HeroBackdrop.tsx` 작성 (클라이언트, 스포트라이트 히어로)**

```tsx
'use client';
import { useSpotlight } from './Spotlight';

export function HeroBackdrop({ verse, meta }: { verse: string; meta: string }) {
  const { spot, beam } = useSpotlight();
  return (
    <div ref={spot} className="relative min-h-[min(88vh,760px)] flex flex-col justify-center items-center text-center px-5 py-[clamp(56px,10vw,120px)] overflow-hidden bg-stage">
      <div ref={beam} className="absolute -inset-[20%] pointer-events-none animate-glow" style={{ background: 'radial-gradient(420px circle at 50% 42%, rgba(233,185,73,.22), rgba(233,185,73,.06) 42%, transparent 70%)' }} />
      <p className="relative font-display text-[clamp(14px,3.4vw,18px)] leading-[2] text-paper/[0.66] max-w-[640px] mb-[clamp(32px,7vw,56px)]">{verse}</p>
      <h1 className="relative font-display font-bold text-[clamp(76px,22vw,200px)] leading-[0.92] tracking-[0.02em] m-0 text-paper" style={{ textShadow: '0 0 60px rgba(233,185,73,.28)' }}>나지르</h1>
      <p className="relative font-display text-[clamp(18px,5vw,32px)] tracking-[0.34em] mt-[clamp(14px,3vw,22px)] text-gold">구별된 사람들</p>
      <p className="relative font-mono text-[clamp(10px,2.6vw,12px)] tracking-[0.12em] text-paper/50 mt-[clamp(28px,6vw,44px)] leading-[2] whitespace-pre-line">{meta}</p>
    </div>
  );
}
```

- [ ] **Step 3: `app/page.tsx` 작성 (서버 컴포넌트)**

```tsx
import Link from 'next/link';
import { HeroBackdrop } from '@/components/HeroBackdrop';
import { getContent } from '@/lib/content';

const cards = [
  { to: '/about', n: '01', title: '<나지르>에 대하여', desc: '연출의 인사말 · 작품 소개' },
  { to: '/process', n: '02', title: '<나지르>가 무대에 오르기까지', desc: '제작 일정 · 함께하는 사람들 · 예산' },
  { to: '/join', n: '03', title: '<나지르>와 함께하기', desc: '후원 안내 · 기도 제목 · Q&A' },
];

export default async function Home() {
  const { site } = await getContent();
  return (
    <section>
      <HeroBackdrop verse={site.heroVerse} meta={site.heroMeta} />
      <div className="max-w-[1180px] mx-auto px-5 pt-[clamp(40px,8vw,80px)] pb-[clamp(90px,14vw,120px)] grid grid-cols-1 sm:grid-cols-3 gap-[clamp(8px,2vw,16px)]">
        {cards.map((c) => (
          <Link key={c.to} href={c.to} className="text-left bg-velvet border border-gold/20 rounded-sm p-[clamp(24px,5vw,32px)] flex flex-col gap-3.5 text-paper hover:border-gold/55 hover:bg-velvet-2 transition-colors">
            <span className="font-mono text-[11px] tracking-[0.2em] text-gold">{c.n}</span>
            <span className="font-display text-[clamp(20px,4.6vw,25px)] leading-[1.4] min-h-[2.8em]">{c.title}</span>
            <span className="text-[13px] font-light text-paper/[0.62] leading-[1.8]">{c.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 테스트 작성**

`components/HeroBackdrop.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroBackdrop } from './HeroBackdrop';

describe('HeroBackdrop', () => {
  it('renders the title, subtitle and passed verse', () => {
    render(<HeroBackdrop verse="테스트 성구" meta={'첫째 줄\n둘째 줄'} />);
    expect(screen.getByRole('heading', { level: 1, name: '나지르' })).toBeInTheDocument();
    expect(screen.getByText('구별된 사람들')).toBeInTheDocument();
    expect(screen.getByText('테스트 성구')).toBeInTheDocument();
  });
});
```
`app/page.test.tsx` (async 서버 컴포넌트는 `await Home()`로 렌더):
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renders hero title and three section links', async () => {
    render(await Home());
    expect(screen.getByRole('heading', { level: 1, name: '나지르' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /에 대하여/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /무대에 오르기까지/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /함께하기/ })).toBeInTheDocument();
  });
});
```
(이 테스트들은 Task 6에서 vitest 설정이 완료된 뒤 통과한다. 지금은 파일만 작성.)

- [ ] **Step 5: 빌드 확인 + Commit**

Run: `npm run build` → 성공.
```bash
git add -A
git commit -m "feat: 홈 페이지를 서버 컴포넌트와 HeroBackdrop로 구현"
```

---

## Task 5: About / Process / Join 페이지 (서버 컴포넌트)

**Files:** Create `app/about/page.tsx`, `app/process/page.tsx`, `app/join/page.tsx`; 디렉티브 추가 `components/Accordion.tsx`, `components/CopyButton.tsx`; Tests `app/about/page.test.tsx`, `app/process/page.test.tsx`, `app/join/page.test.tsx`.

- [ ] **Step 1: 인터랙티브 컴포넌트에 `'use client';` 추가**

`components/Accordion.tsx`, `components/CopyButton.tsx` 각 파일 첫 줄에 `'use client';`(내용 그대로). `components/StatusChip.tsx`는 훅이 없으므로 서버 컴포넌트로 두고 디렉티브 불필요.

- [ ] **Step 2: `app/about/page.tsx` (Phase 1 About을 서버 컴포넌트로)**

```tsx
import { getContent } from '@/lib/content';

export default async function About() {
  const { site, characters } = await getContent();
  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(48px,9vw,88px)] pb-[clamp(100px,14vw,140px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">01 / ABOUT</p>
      <h2 className="font-display font-bold text-[clamp(30px,7.5vw,46px)] leading-[1.35] text-paper mb-[clamp(40px,8vw,64px)]">&lt;나지르&gt;에 대하여</h2>

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] items-start mb-[clamp(56px,9vw,80px)]">
        <div className="aspect-[3/4] border border-gold/25 bg-[repeating-linear-gradient(135deg,#17131F,#17131F_8px,#1C1726_8px,#1C1726_16px)] flex items-center justify-center text-center p-4">
          <span className="font-mono text-[11px] leading-[1.9] text-paper/50">연출자 사진<br />3:4 · 세로</span>
        </div>
        <div>
          <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-gold mb-[18px]">연출의 인사말</h3>
          <p className="text-sm font-light leading-[2.1] text-paper/50 mb-7 whitespace-pre-line">{site.aboutGreeting}</p>
          <div className="border-t border-gold/20 pt-[18px] flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">DIRECTOR</span>
            <span className="font-display text-[22px] text-paper">정은수</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)] mb-[clamp(56px,9vw,80px)]">
        <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-gold mb-[22px]">Praysound의 이야기</h3>
        <p className="font-display text-[clamp(17px,4.2vw,21px)] leading-[1.95] text-paper mb-6">{site.praysoundStory1}</p>
        <p className="text-sm font-light leading-[2.1] text-paper/[0.72]">{site.praysoundStory2}</p>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)] mb-[clamp(56px,9vw,80px)]">
        <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-gold mb-6">작품 개요</h3>
        <dl className="m-0 grid gap-px bg-gold/[0.14] border border-gold/[0.14]">
          {site.facts.map((f) => (
            <div key={f.key} className="bg-velvet px-[18px] py-4 flex gap-4 items-baseline">
              <dt className="font-mono text-[11px] tracking-[0.12em] text-paper/50 min-w-[84px]">{f.key}</dt>
              <dd className="m-0 text-sm font-light text-paper">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)] mb-[clamp(56px,9vw,80px)] grid gap-9">
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold mb-4">LOGLINE</h3>
          <p className="font-display text-[clamp(19px,5vw,27px)] leading-[1.8] text-paper">{site.logline}</p>
        </div>
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold mb-4">SYNOPSIS</h3>
          <p className="text-sm font-light leading-[2.15] text-paper/[0.78]">{site.synopsis}</p>
        </div>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)]">
        <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-gold mb-6">주요 등장인물</h3>
        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {characters.map((c) => (
            <article key={c.id} className="bg-velvet border border-gold/[0.14] p-5 flex flex-col gap-3">
              <div className="aspect-square bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
                <span className="font-mono text-[10px] text-paper/40">배우 사진 1:1</span>
              </div>
              <h4 className="font-display text-2xl text-gold m-0">{c.name}</h4>
              <p className="text-[13px] font-light leading-[1.95] text-paper/[0.72] m-0">{c.description}</p>
            </article>
          ))}
        </div>
        <p className="text-[13px] font-light text-paper/55 mt-6 pl-4 border-l-2 border-gold/40">이 외에도 7명의 조연과 9명의 앙상블이 함께 &lt;나지르&gt;를 채워갑니다.</p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `app/process/page.tsx`**

```tsx
import { Accordion } from '@/components/Accordion';
import { StatusChip } from '@/components/StatusChip';
import { getContent } from '@/lib/content';

export default async function Process() {
  const { site, timeline, people, budget } = await getContent();
  return (
    <section className="max-w-[900px] mx-auto px-5 py-[clamp(48px,9vw,88px)] pb-[clamp(100px,14vw,140px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">02 / PROCESS</p>
      <h2 className="font-display font-bold text-[clamp(30px,7.5vw,46px)] leading-[1.35] text-paper mb-4">무대에 오르기까지</h2>
      <p className="text-sm font-light leading-[2] text-paper/[0.72] mb-[clamp(40px,8vw,64px)] max-w-[56ch]">{site.processIntro}</p>

      <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-paper mb-4">제작 일정</h3>
      <ol className="list-none m-0 mb-[clamp(48px,8vw,72px)] p-0 grid gap-px bg-gold/[0.14] border border-gold/[0.14]">
        {timeline.map((t) => (
          <li key={t.id} className="bg-velvet px-[18px] py-4 flex flex-wrap gap-x-4 gap-y-2 items-center">
            <span className="font-mono text-[11px] tracking-[0.08em] text-paper/50 min-w-[150px]">{t.period}</span>
            <span className="text-sm text-paper flex-1 min-w-[140px]">{t.title}</span>
            <StatusChip status={t.status} />
          </li>
        ))}
      </ol>

      <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-paper mb-3">함께 세우는 사람들</h3>
      <p className="text-sm font-light leading-[2] text-paper/[0.72] mb-5">{site.peopleIntro}</p>
      <div className="grid gap-px bg-gold/[0.14] border border-gold/[0.14] mb-[clamp(48px,8vw,72px)]">
        {people.map((g) => (
          <Accordion key={g.id} label={g.label} defaultOpen={g.label === '헤더진'}>
            {g.members.map((m) => (
              <p key={m.id} className="m-0 text-[13.5px] font-light leading-[1.95] text-paper/[0.78]">{m.text}</p>
            ))}
          </Accordion>
        ))}
      </div>

      <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-paper mb-2">제작 예산</h3>
      <p className="font-mono text-[clamp(24px,7vw,38px)] text-gold mb-5">{site.budgetTotal}</p>
      <ul className="list-none m-0 mb-[18px] p-0 grid gap-px [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] bg-gold/[0.14] border border-gold/[0.14]">
        {budget.map((b) => (
          <li key={b.id} className="bg-velvet px-4 py-[15px] flex justify-between gap-2.5 items-baseline">
            <span className="text-[13.5px] text-paper">{b.name}</span>
            <span className="font-mono text-[11px] text-paper/45">미공개</span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] font-light leading-[1.9] text-paper/70 pl-3.5 border-l-2 border-gold">{site.budgetNote}</p>
    </section>
  );
}
```

- [ ] **Step 4: `app/join/page.tsx`**

```tsx
import { CopyButton } from '@/components/CopyButton';
import { getContent } from '@/lib/content';

export default async function Join() {
  const { site, prayers } = await getContent();
  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(48px,9vw,88px)] pb-[clamp(100px,14vw,140px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">03 / JOIN</p>
      <h2 className="font-display font-bold text-[clamp(30px,7.5vw,46px)] leading-[1.35] text-paper mb-[clamp(36px,7vw,56px)]">&lt;나지르&gt;와 함께하기</h2>

      <p className="font-display text-[clamp(17px,4.4vw,23px)] leading-[1.95] text-paper/[0.86] mb-2.5">{site.joinVerse}</p>
      <p className="font-mono text-[11px] tracking-[0.14em] text-gold mb-[clamp(48px,8vw,72px)]">{site.joinVerseRef}</p>

      <div className="border border-gold/30 bg-gradient-to-b from-velvet to-stage p-[clamp(24px,6vw,36px)] mb-[clamp(40px,7vw,60px)]">
        <h3 className="font-display text-[clamp(21px,5vw,28px)] text-gold mb-[18px]">후원으로 함께하기</h3>
        <p className="text-sm font-light leading-[2.1] text-paper/[0.78] mb-[26px]">{site.supportIntro}</p>
        <a href={site.supportFormUrl} target="_blank" rel="noopener" className="flex items-center justify-center min-h-[56px] bg-gold text-ink font-body text-base font-medium rounded-sm mb-5 hover:bg-gold-soft transition-colors">후원 신청서 작성하기</a>
        <div className="border border-dashed border-gold/35 p-[18px] flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] tracking-[0.16em] text-paper/50">{site.accountBank}</span>
            <span className="font-mono text-[clamp(16px,4.6vw,20px)] text-paper">{site.accountNumber}</span>
            <span className="text-[12.5px] font-light text-paper/60">{site.accountHolder}</span>
          </div>
          <CopyButton value={site.accountNumber} idleLabel="계좌번호 복사하기" doneLabel="계좌번호가 복사되었습니다" />
        </div>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)] mb-[clamp(40px,7vw,60px)]">
        <h3 className="font-display text-[clamp(21px,5vw,28px)] text-gold mb-4">기도로 함께하기</h3>
        <p className="font-display text-[clamp(16px,4.2vw,20px)] leading-[1.95] text-paper/[0.86] mb-7">{site.prayerIntro}</p>
        <ol className="list-none m-0 p-0 grid gap-3.5">
          {prayers.map((p, i) => (
            <li key={p.id} className="flex gap-3.5 items-baseline">
              <span className="font-mono text-[11px] text-gold flex-none">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-sm font-light leading-[2] text-paper/80">{p.text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)]">
        <h3 className="font-display text-[clamp(21px,5vw,28px)] text-gold mb-4">Q&amp;A · 응원으로 함께하기</h3>
        <p className="text-sm font-light leading-[2.1] text-paper/[0.78] mb-6">{site.qnaIntro}</p>
        <a href={site.qnaUrl} target="_blank" rel="noopener" className="flex items-center justify-center min-h-[56px] border border-gold/50 text-gold text-[15px] font-medium rounded-sm hover:bg-gold/[0.12] transition-colors">질문 · 응원 남기기</a>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 페이지 테스트 작성 (`await Page()` 패턴)**

`app/about/page.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from './page';

describe('About', () => {
  it('renders synopsis and all six characters', async () => {
    render(await About());
    expect(screen.getByText(/평생의 목표였던 오디션에서 탈락/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '아론' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '라이' })).toBeInTheDocument();
  });
});
```
`app/process/page.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Process from './page';

describe('Process', () => {
  it('renders timeline, a status chip, and budget total', async () => {
    render(await Process());
    expect(screen.getByText('대본 작업')).toBeInTheDocument();
    expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
    expect(screen.getByText('₩ 9,000,000')).toBeInTheDocument();
    expect(screen.getByText(/연출 정은수/)).toBeInTheDocument();
  });
});
```
`app/join/page.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Join from './page';

describe('Join', () => {
  it('shows account number and external links', async () => {
    render(await Join());
    expect(screen.getByText('3333-23-3584437')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /후원 신청서/ })).toHaveAttribute('href', 'https://forms.gle/dtEFEf2E1ArqGEwH6');
    expect(screen.getByRole('link', { name: /질문 · 응원 남기기/ })).toBeInTheDocument();
  });
});
```
(Task 6에서 vitest 설정 후 통과.)

- [ ] **Step 6: 빌드 확인 + Commit**

Run: `npm run build` → 4개 라우트 모두 생성 성공.
```bash
git add -A
git commit -m "feat: 대하여·무대에 오르기까지·함께하기 페이지를 서버 컴포넌트로 구현"
```

---

## Task 6: 테스트 환경 이관 (Vitest for Next)

**Files:** Create `vitest.config.mts`; Modify `package.json`(deps), `vitest.setup.ts`; 필요 시 next/navigation 목. 기존 테스트 파일들 정리.

- [ ] **Step 1: 테스트 의존성 확인/설치**

`vite-tsconfig-paths`가 없으면 설치(그 외 vitest·RTL·jsdom·@vitejs/plugin-react·jest-dom은 Phase 1에서 이미 설치됨):
```bash
npm install -D vite-tsconfig-paths
```

- [ ] **Step 2: `vitest.config.mts` 작성**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```
(Task 1에서 `vite.config.ts`는 이미 삭제됨. Vitest는 이 `vitest.config.mts`를 사용한다.)

- [ ] **Step 3: `vitest.setup.ts` 확인**

내용: `import '@testing-library/jest-dom/vitest';` (Task 2에서 이동됨).

- [ ] **Step 4: Header 테스트 추가 (usePathname 목)**

`components/Header.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

vi.mock('next/navigation', () => ({ usePathname: () => '/about' }));

describe('Header', () => {
  it('renders nav links and marks the active route', () => {
    render(<Header />);
    const about = screen.getByRole('link', { name: '대하여' });
    expect(about).toBeInTheDocument();
    expect(about).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '함께하기' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: 남은 Phase 1 테스트 정리 확인**

- `components/Accordion.test.tsx`, `components/CopyButton.test.tsx`, `components/Curtain.test.tsx` — 변경 없이 통과해야 함(디렉티브 추가는 렌더에 영향 없음).
- `content/types.test.ts`, `content/data.test.ts`, `lib/content.test.ts` — 상대 import 유지, 통과.
- `components/Layout.test.tsx`, `src/App.test.tsx`, `src/pages/*.test.tsx`는 Task 1·2에서 이미 삭제/이동됨. 남아 있으면 삭제(레이아웃은 `<html>`을 렌더하므로 단위 테스트 대상 아님 — Header/Footer/페이지 테스트로 대체됨).

- [ ] **Step 6: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 통과 — 페이지(await), HeroBackdrop, Header(목), Accordion, CopyButton, Curtain, 콘텐츠/데이터. 실패 시 해결(예: next/navigation 목 누락, 경로).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: Next.js 환경에 맞게 Vitest 설정과 테스트 이관"
```

---

## Task 7: 전체 검증 · 빌드 · README

**Files:** Modify `README.md`. 검증만.

- [ ] **Step 1: 전체 테스트 + 프로덕션 빌드**

Run: `npm test` → 전부 통과.
Run: `npm run build` → 4개 라우트 생성 성공(타입 오류 없음).

- [ ] **Step 2: 개발 서버로 4개 경로 육안 확인**

```bash
npm run dev
```
`/`, `/about`, `/process`, `/join`을 열어 콘텐츠·반응형(모바일 폭)·계좌 복사·아코디언·커튼·헤더 활성표시·스포트라이트를 확인. 확인 후 종료.

- [ ] **Step 3: README 갱신**

Vite → Next.js로 실행법 갱신:
- 스크립트: `npm run dev`(개발), `npm run build`(빌드), `npm start`(프로덕션), `npm test`.
- 구조 표를 `app/` 라우팅 + `components/`·`content/`·`lib/`로 갱신.
- 로드맵의 Phase 2 상태 업데이트(2A 완료, 2B 예정).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: Next.js 실행법으로 README 갱신"
```

---

## 후속 (별도 계획)

- **Phase 2B** — Supabase 이관: 마이그레이션/시드 SQL, `@supabase/ssr` 서버 클라이언트, `lib/content.ts`를 Supabase 우선 + 로컬 폴백으로 교체(환경변수 `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`). 페이지는 이미 서버에서 `await getContent()`를 호출하므로 이 계층만 교체.
- **Phase 3** — 관리자 로그인·편집·사진 업로드(`@supabase/ssr` 세션 + 미들웨어).

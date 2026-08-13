# 〈나지르〉 Phase 1 — React 이식 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 HTML 시안(`나지르.dc.html`)을 Vite + React + TypeScript + Tailwind 반응형 웹으로 이식해, 백엔드 없이도 완성·배포 가능한 공개 소개 사이트를 만든다.

**Architecture:** 모든 문구를 타입이 잡힌 로컬 데이터로 분리하고, 화면은 **비동기 데이터 접근 계층**(`src/lib/content.ts`)만 의존한다. Phase 1에서 이 계층은 로컬 데이터를 `Promise.resolve`로 반환하고, Phase 2에서 Supabase 호출로 교체해도 화면 코드는 그대로다. 라우팅은 React Router로 실제 URL을 부여한다.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v3, React Router v6, Vitest + React Testing Library

**Source of truth for content values:** `나지르.dc.html`의 `renderVals()` 메서드(파일 하단 `<script type="text/x-dc">` 블록). 인물·일정·예산·기도제목·명단·색 토큰의 실제 값은 이 함수에서 그대로 옮긴다.

---

## File Structure

| 경로 | 책임 |
|------|------|
| `index.html` | 폰트 preconnect/링크, 루트 마운트 |
| `tailwind.config.ts` | 디자인 토큰(색·폰트) 정의 |
| `src/index.css` | Tailwind 지시자, 전역 배경/스크롤 |
| `src/main.tsx` | React 마운트 + Router |
| `src/App.tsx` | 라우트 정의 + Layout 래핑 |
| `src/content/types.ts` | 모든 콘텐츠 TS 타입 |
| `src/content/data.ts` | 시안에서 옮긴 초기 콘텐츠 데이터 |
| `src/lib/content.ts` | 비동기 데이터 접근 함수(Phase 2에서 교체 지점) |
| `src/lib/useContent.ts` | 로딩/에러 상태를 다루는 훅 |
| `src/components/Layout.tsx` | 헤더 + `<Outlet/>` + 푸터 |
| `src/components/Header.tsx` | 상단 네비게이션 |
| `src/components/Footer.tsx` | 푸터 |
| `src/components/StatusChip.tsx` | 일정 상태칩(완료/진행 중/예정) |
| `src/components/Accordion.tsx` | 명단 그룹 펼침/접힘 |
| `src/components/CopyButton.tsx` | 계좌 원터치 복사 |
| `src/components/Curtain.tsx` | 커튼 오프닝 애니메이션 |
| `src/components/Spotlight.tsx` | 홈 스포트라이트 `pointermove` |
| `src/pages/Home.tsx` | `/` |
| `src/pages/About.tsx` | `/about` |
| `src/pages/Process.tsx` | `/process` |
| `src/pages/Join.tsx` | `/join` |
| `src/test/setup.ts` | Vitest 셋업(jest-dom) |

---

## Task 1: 프로젝트 스캐폴딩

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Vite React-TS 템플릿 생성**

작업 디렉터리는 이미 git repo(`/Users/predevho/nazir`)다. 현재 폴더에 스캐폴딩한다:

```bash
npm create vite@latest . -- --template react-ts
```

프롬프트에서 "현재 디렉터리에 파일이 있음"이 나오면 **기존 파일 유지(Ignore/무시)** 를 택한다(README, docs 보존).

- [ ] **Step 2: 의존성 설치**

```bash
npm install
npm install react-router-dom
```

- [ ] **Step 3: 개발 서버가 뜨는지 확인**

Run: `npm run dev`
Expected: `Local: http://localhost:5173/` 출력. 확인 후 Ctrl+C로 종료.

- [ ] **Step 4: Vite 기본 데모 파일 정리**

`src/App.css`, `src/assets/`의 데모 자산, `public/vite.svg`를 삭제하고 `src/App.tsx`를 최소로 비운다:

```tsx
export default function App() {
  return <div>나지르</div>;
}
```

`src/main.tsx`는 아래로 교체:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react-ts project"
```

---

## Task 2: Tailwind + 디자인 토큰 + 폰트

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`
- Modify: `src/index.css`, `index.html`

- [ ] **Step 1: Tailwind 설치**

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: `tailwind.config.ts` 작성**

`tailwind.config.js`가 생성되었으면 `tailwind.config.ts`로 바꾸고 내용 교체(시안 디자인 토큰 반영):

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        stage: '#0B0A0E',
        velvet: '#17131F',
        'velvet-2': '#1D1727',
        gold: '#E9B949',
        'gold-soft': '#F5D488',
        'gold-deep': '#8A6F2E',
        paper: '#F2EADA',
        ink: '#1A1712',
      },
      fontFamily: {
        display: ["'Gowun Batang'", 'serif'],
        body: ["'IBM Plex Sans KR'", 'system-ui', 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace'],
      },
      keyframes: {
        curtainL: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-101%)' } },
        curtainR: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(101%)' } },
        riseIn: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glow: { '0%,100%': { opacity: '.55' }, '50%': { opacity: '.9' } },
      },
      animation: {
        curtainL: 'curtainL 1.3s cubic-bezier(.7,0,.2,1) .25s forwards',
        curtainR: 'curtainR 1.3s cubic-bezier(.7,0,.2,1) .25s forwards',
        glow: 'glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

생성된 `tailwind.config.js`가 남아 있으면 삭제한다.

- [ ] **Step 3: `src/index.css` 교체**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body { margin: 0; padding: 0; background: #0B0A0E; }
* { box-sizing: border-box; }
body {
  font-family: 'IBM Plex Sans KR', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
a { color: #E9B949; text-decoration: none; }
a:hover { color: #F5D488; }
:focus-visible { outline: 2px solid #E9B949; outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
}
```

- [ ] **Step 4: `index.html`에 폰트 링크 추가**

`<head>` 안에 추가(시안과 동일):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

`<title>`을 `나지르 · 구별된 사람들`로, `<html lang="ko">`로 설정한다.

- [ ] **Step 5: 토큰이 적용되는지 확인**

`src/App.tsx`를 임시로:

```tsx
export default function App() {
  return <div className="min-h-screen bg-stage text-paper font-display text-4xl p-8">나지르</div>;
}
```

Run: `npm run dev`
Expected: 어두운 배경(#0B0A0E)에 골드빛 아닌 페이퍼색 Gowun Batang 큰 글씨. 확인 후 종료.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: configure tailwind with design tokens and fonts"
```

---

## Task 3: 테스트 환경 (Vitest + RTL)

**Files:**
- Create: `src/test/setup.ts`
- Modify: `vite.config.ts`, `package.json`

- [ ] **Step 1: 테스트 의존성 설치**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: `src/test/setup.ts` 작성**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: `vite.config.ts`에 test 설정 추가**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: `package.json`에 test 스크립트 추가**

`"scripts"`에 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: 스모크 테스트로 러너 확인**

Create `src/test/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('test runner', () => {
  it('works', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: PASS (1 passed).

- [ ] **Step 6: 스모크 테스트 삭제 후 Commit**

```bash
rm src/test/smoke.test.ts
git add -A
git commit -m "chore: set up vitest and testing-library"
```

---

## Task 4: 콘텐츠 타입 정의

**Files:**
- Create: `src/content/types.ts`
- Test: `src/content/types.test.ts` (컴파일 확인용 최소 테스트)

- [ ] **Step 1: 타입 작성**

`src/content/types.ts`:

```ts
export type TimelineStatus = '완료' | '진행 중' | '예정';

export interface Character {
  id: string;
  name: string;
  description: string;
  photoUrl: string | null;
  sortOrder: number;
}

export interface TimelineEvent {
  id: string;
  period: string;
  title: string;
  status: TimelineStatus;
  sortOrder: number;
}

export interface BudgetItem {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Prayer {
  id: string;
  text: string;
  sortOrder: number;
}

export interface PeopleMember {
  id: string;
  text: string;
  sortOrder: number;
}

export interface PeopleGroup {
  id: string;
  label: string;
  sortOrder: number;
  members: PeopleMember[];
}

export interface Fact {
  key: string;
  value: string;
}

/** content_blocks 단일 문구 — Phase 2에서 key/value 테이블이 됨 */
export interface SiteContent {
  heroVerse: string;
  heroSubtitle: string;
  heroMeta: string;
  aboutGreeting: string;
  praysoundStory1: string;
  praysoundStory2: string;
  logline: string;
  synopsis: string;
  facts: Fact[];
  processIntro: string;
  peopleIntro: string;
  budgetTotal: string;
  budgetNote: string;
  joinVerse: string;
  joinVerseRef: string;
  supportIntro: string;
  supportFormUrl: string;
  accountBank: string;
  accountNumber: string;
  accountHolder: string;
  prayerIntro: string;
  qnaIntro: string;
  qnaUrl: string;
  instagramMain: string;
  instagramMusical: string;
  youtube: string;
  contactInstagram: string;
}

export interface AllContent {
  site: SiteContent;
  characters: Character[];
  timeline: TimelineEvent[];
  budget: BudgetItem[];
  prayers: Prayer[];
  people: PeopleGroup[];
}
```

- [ ] **Step 2: 타입 사용 테스트 작성 (실패 확인용)**

`src/content/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { TimelineEvent } from './types';

describe('content types', () => {
  it('accepts a valid timeline status', () => {
    const e: TimelineEvent = { id: '1', period: '26.01', title: '대본', status: '완료', sortOrder: 0 };
    expect(e.status).toBe('완료');
  });
});
```

- [ ] **Step 3: 테스트 실행**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add content type definitions"
```

---

## Task 5: 초기 콘텐츠 데이터

**Files:**
- Create: `src/content/data.ts`
- Test: `src/content/data.test.ts`

각 값은 `나지르.dc.html`의 `renderVals()`에서 그대로 옮긴다. 아래 구조·매핑을 따르고, 목록 항목의 실제 문자열은 시안에서 복사한다.

- [ ] **Step 1: 데이터 테스트 작성 (기대 개수·매핑 고정)**

`src/content/data.test.ts` — 시안의 개수와 일치하는지로 이식 누락을 잡는다:

```ts
import { describe, it, expect } from 'vitest';
import { content } from './data';

describe('content data', () => {
  it('has 6 characters', () => {
    expect(content.characters).toHaveLength(6);
  });
  it('has 20 timeline events', () => {
    expect(content.timeline).toHaveLength(20);
  });
  it('has 8 budget items', () => {
    expect(content.budget).toHaveLength(8);
  });
  it('has 6 prayers', () => {
    expect(content.prayers).toHaveLength(6);
  });
  it('has 3 people groups', () => {
    expect(content.people).toHaveLength(3);
  });
  it('has the kakaobank account number', () => {
    expect(content.site.accountNumber).toBe('3333-23-3584437');
  });
  it('keeps timeline items ordered by sortOrder', () => {
    const orders = content.timeline.map((t) => t.sortOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test src/content/data.test.ts`
Expected: FAIL ("Cannot find module './data'").

- [ ] **Step 3: `src/content/data.ts` 작성**

구조는 아래 골격을 그대로 쓰고, `...` 부분은 시안 `renderVals()`의 해당 배열/문구를 옮긴다:
- `characters` ← 시안 `characters` 배열(name, desc) — 6개
- `timeline` ← 시안 `rows` 배열(`[period, title, status]`) — 20개, 배열 순서대로 `sortOrder` 부여
- `budget` ← 시안 `budget` 이름 배열 — 8개
- `prayers` ← 시안 `prayers` 텍스트 배열 — 6개
- `people` ← 시안 `groups`(label + rows) — 3그룹
- `facts` ← 시안 `facts` 배열 — 5개
- 단일 문구: 인사말/시놉시스/로그라인/성구/링크/계좌 등은 시안 각 섹션 마크업에서 옮긴다.

```ts
import type { AllContent, TimelineEvent } from './types';

const rows: [string, string, TimelineEvent['status']][] = [
  ['26.01.12 ~ 26.06.28', '대본 작업', '완료'],
  // ... 시안 renderVals()의 rows 20개를 그대로 옮긴다 ...
  ['27.01 또는 27.02', '<나지르> 공연', '예정'],
];

export const content: AllContent = {
  site: {
    heroVerse: '“사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라”',
    heroSubtitle: '구별된 사람들',
    heroMeta: '2027 창작뮤지컬 · 제작 PRAYSOUND / 연출 정은수 · 2027.01–02 예정',
    aboutGreeting: '인사말 원문이 확보되는 대로 이 자리에 들어갑니다. 3~5문단 분량을 기준으로 여백을 잡아두었습니다.',
    praysoundStory1: 'Praysound는 세상 모든 아픔에 하나님의 위로를 전달하는 매개가 되어 궁극적으로 영혼 구원의 사명을 이루는 사역팀입니다.',
    praysoundStory2: '앞으로 Praysound는 — 실패를 지나온 사람에게 다시 일어설 용기를 / 상처 입은 사람에게 하나님의 위로를 / 길을 잃은 사람에게 그 언젠가 말씀하신 부르심의 기억을 선물하고 싶습니다. <나지르>는 그 선물입니다.',
    logline: '실패로 신앙을 잃은 청년이, 버린 노래를 통해 하나님의 뜻과 자신의 사명을 다시 발견한다.',
    synopsis: '신앙과 재능 모두 완벽한 청년 “아론”은 평생의 목표였던 오디션에서 탈락하며 삶과 믿음이 동시에 무너진다. 방황 끝에 세상과 타협하며 자신을 잃어가던 그는, 오디션을 위해 만들었다가 실패 이후 버렸던 자신의 노래가 누군가의 인생을 살렸다는 사실을 알게 된다. 그 경험을 통해 아론은 성공이 아닌 ‘쓰임’이 하나님의 뜻일 수 있음을 깨닫는다.',
    facts: [
      { key: 'FORM', value: '창작 뮤지컬' },
      { key: 'GENRE', value: '드라마' },
      { key: 'PRODUCED', value: 'Praysound' },
      { key: 'RUNNING', value: '약 2시간 (인터미션 포함)' },
      { key: 'DATE', value: '2027년 1월 또는 2월 예정' },
    ],
    processIntro: '준비 과정을 있는 그대로 공개합니다. 함께하는 사람들과 필요한 예산을 모아 주세요.',
    peopleIntro: '각자의 자리에서 기도하며 준비하는 배우와 헤더진, 스태프가 함께 <나지르>를 세워가고 있습니다.',
    budgetTotal: '₩ 9,000,000',
    budgetNote: '항목별 금액은 확정 후 공개됩니다. 공연 종료 후 결산 내역을 후원자께 공유합니다.',
    joinVerse: '“한 사람이면 패하겠거니와 두 사람이면 맞설 수 있나니 세 겹 줄은 쉽게 끊어지지 아니하느니라”',
    joinVerseRef: '전도서 4:12',
    supportIntro: '하나님의 사람들이 모이면 그 안에는 힘이 있습니다. 보내주신 후원은 공연을 준비하는 데 필요한 곳에 소중히 사용됩니다. 하나님의 위로를 전하는 이 사역이 온전히 세워질 수 있도록, 함께해 주세요.',
    supportFormUrl: 'https://forms.gle/dtEFEf2E1ArqGEwH6',
    accountBank: 'KAKAOBANK',
    accountNumber: '3333-23-3584437',
    accountHolder: '예금주 정은수',
    prayerIntro: '무대보다 먼저, 우리의 마음이 하나님 앞에 준비되기를 원합니다.',
    qnaIntro: '<나지르>에 대해 궁금한 점이나 응원의 말을 자유롭게 남겨 주세요. 작품, 공연 준비 과정에 대한 질문도 좋고, 짧은 기도와 응원의 한 마디도 큰 힘이 됩니다.',
    qnaUrl: 'https://www.joey.team/b/hS1LZbUjUeYC7HxjompE',
    instagramMain: 'https://www.instagram.com/',
    instagramMusical: 'https://www.instagram.com/',
    youtube: 'https://www.youtube.com/',
    contactInstagram: 'https://www.instagram.com/musical_naz/',
  },
  characters: [
    { id: 'aron', name: '아론', description: '신앙과 재능 모두 완벽해 보였던 청년. 오디션 탈락 이후 무너진 시간을 지나지만, 자신의 진정한 사명 앞에 다시 돌아오게 된다.', photoUrl: null, sortOrder: 0 },
    // ... 시안 characters 배열의 나머지 5명(한나·나나·폴·카이·라이)을 옮긴다 ...
  ],
  timeline: rows.map(([period, title, status], i) => ({ id: `t${i}`, period, title, status, sortOrder: i })),
  budget: ['기획 및 홍보', '티켓 제작', '이동 및 차량 대여', '식비와 숙박', '무대 제작', '의상 · 분장 · 소품', '음향과 조명', '예비비'].map((name, i) => ({ id: `b${i}`, name, sortOrder: i })),
  prayers: [
    '준비 과정 가운데 하나님의 개입 없는 보통의 일들과의 분명한 구분이 있길 소망합니다.',
    // ... 시안 prayers 배열의 나머지 5개를 옮긴다 ...
  ].map((text, i) => ({ id: `p${i}`, text, sortOrder: i })),
  people: [
    {
      id: 'g0', label: '헤더진', sortOrder: 0,
      members: [
        '연출 정은수 / 조연출 권도원',
        '디자인팀장 정은민 / 미디어팀장 김수연 / 홍보팀장 홍빛',
        '무대감독 이하은 / 안무팀장 이하늘 / 의소품팀장 김가은',
      ].map((text, i) => ({ id: `g0m${i}`, text, sortOrder: i })),
    },
    // ... 시안 groups 배열의 '팀원', '배우' 그룹을 같은 형태로 옮긴다 ...
  ],
};
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `npm test src/content/data.test.ts`
Expected: PASS (7 passed). 실패하면 개수가 맞을 때까지 시안에서 누락된 항목을 채운다.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: port site content from mockup into typed data"
```

---

## Task 6: 데이터 접근 계층 + 훅

**Files:**
- Create: `src/lib/content.ts`, `src/lib/useContent.ts`
- Test: `src/lib/content.test.ts`

- [ ] **Step 1: 접근 계층 테스트 작성**

`src/lib/content.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getContent } from './content';

describe('getContent', () => {
  it('resolves with the full content payload', async () => {
    const data = await getContent();
    expect(data.characters).toHaveLength(6);
    expect(data.site.accountNumber).toBe('3333-23-3584437');
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test src/lib/content.test.ts`
Expected: FAIL ("Cannot find module './content'").

- [ ] **Step 3: `src/lib/content.ts` 작성**

Phase 2에서 이 파일 내부만 Supabase 호출로 바꾼다. 인터페이스(async)는 유지된다.

```ts
import { content } from '../content/data';
import type { AllContent } from '../content/types';

/** Phase 1: 로컬 데이터. Phase 2: Supabase에서 읽어 동일 형태로 반환. */
export async function getContent(): Promise<AllContent> {
  return content;
}
```

- [ ] **Step 4: `src/lib/useContent.ts` 작성 (로딩/에러 상태)**

```ts
import { useEffect, useState } from 'react';
import { getContent } from './content';
import type { AllContent } from '../content/types';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; data: AllContent };

export function useContent(): State {
  const [state, setState] = useState<State>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    getContent()
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch((error) => alive && setState({ status: 'error', error }));
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `npm test src/lib/content.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add async content access layer and useContent hook"
```

---

## Task 7: 공통 레이아웃 (헤더 · 푸터)

**Files:**
- Create: `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/components/Layout.tsx`
- Test: `src/components/Layout.test.tsx`

- [ ] **Step 1: 레이아웃 테스트 작성**

`src/components/Layout.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';

describe('Layout', () => {
  it('renders nav links and footer brand', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>본문</div>
        </Layout>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: '대하여' })).toBeInTheDocument();
    expect(screen.getByText('본문')).toBeInTheDocument();
    expect(screen.getAllByText('나지르').length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test src/components/Layout.test.tsx`
Expected: FAIL ("Cannot find module './Layout'").

- [ ] **Step 3: `Header.tsx` 작성**

시안 `<header>`/`<nav>`을 Tailwind로 옮기고 버튼 대신 `<Link>` 사용:

```tsx
import { Link, NavLink } from 'react-router-dom';

const items = [
  { to: '/about', label: '대하여' },
  { to: '/process', label: '무대에 오르기까지' },
  { to: '/join', label: '함께하기' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-[100] bg-stage/85 backdrop-blur-md border-b border-gold/15">
      <nav className="max-w-[1180px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-2 text-paper">
          <span className="font-display text-[22px] tracking-[0.06em] text-gold">나지르</span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-paper/50">NAZIR</span>
        </Link>
        <div className="flex gap-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className="font-body text-[13px] text-paper/70 px-2.5 py-2 rounded-md hover:text-gold hover:bg-gold/[0.08] transition-colors"
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: `Footer.tsx` 작성**

시안 `<footer>`를 옮긴다(SNS/문의 링크는 `content.site`에서 받는다). 시그니처:

```tsx
import type { SiteContent } from '../content/types';

export function Footer({ site }: { site?: SiteContent }) {
  return (
    <footer className="bg-velvet border-t border-gold/15 px-5 py-[clamp(40px,8vw,64px)]">
      <div className="max-w-[1180px] mx-auto grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="flex flex-col gap-2.5">
          <span className="font-display text-[26px] text-gold">나지르</span>
          <span className="font-display text-[15px] tracking-[0.2em] text-paper/70">구별된 사람들</span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-paper/45 leading-loose">2027 창작뮤지컬 · 제작 PRAYSOUND</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">CONTACT</span>
          <a href={site?.contactInstagram ?? '#'} target="_blank" rel="noopener" className="text-[13.5px] font-light">문의 — musical_naz(Instagram DM)</a>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">FOLLOW</span>
          <a href={site?.instagramMain ?? '#'} target="_blank" rel="noopener" className="text-[13.5px] font-light">Instagram — Pray Sound</a>
          <a href={site?.instagramMusical ?? '#'} target="_blank" rel="noopener" className="text-[13.5px] font-light">Instagram — 뮤지컬 나지르</a>
          <a href={site?.youtube ?? '#'} target="_blank" rel="noopener" className="text-[13.5px] font-light">YouTube — Pray Sound</a>
        </div>
      </div>
      <p className="max-w-[1180px] mx-auto mt-[clamp(36px,7vw,56px)] pt-5 border-t border-gold/10 font-display text-[13px] text-paper/50">사람이 마음으로 자기의 길을 계획할지라도 — 잠 16:9</p>
    </footer>
  );
}
```

- [ ] **Step 5: `Layout.tsx` 작성**

```tsx
import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useContent } from '../lib/useContent';

export function Layout({ children }: { children: ReactNode }) {
  const state = useContent();
  const site = state.status === 'ready' ? state.data.site : undefined;
  return (
    <div className="bg-stage text-paper min-h-screen overflow-x-hidden">
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer site={site} />
    </div>
  );
}
```

- [ ] **Step 6: 테스트 실행 (통과 확인)**

Run: `npm test src/components/Layout.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add header, footer, and layout"
```

---

## Task 8: 라우터 + 페이지 골격

**Files:**
- Modify: `src/App.tsx`
- Create: `src/pages/Home.tsx`, `src/pages/About.tsx`, `src/pages/Process.tsx`, `src/pages/Join.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: 라우팅 테스트 작성**

`src/App.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('routing', () => {
  it('renders the about heading at /about', async () => {
    renderAt('/about');
    expect(await screen.findByRole('heading', { name: /나지르.*에 대하여/ })).toBeInTheDocument();
  });
  it('renders the join heading at /join', async () => {
    renderAt('/join');
    expect(await screen.findByRole('heading', { name: /함께하기/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 페이지 골격 4개 작성 (제목만)**

각 파일은 우선 제목만 렌더한다. 예 `src/pages/About.tsx`:

```tsx
export default function About() {
  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(48px,9vw,88px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">01 / ABOUT</p>
      <h2 className="font-display font-bold text-[clamp(30px,7.5vw,46px)] leading-[1.35] text-paper">&lt;나지르&gt;에 대하여</h2>
    </section>
  );
}
```

`Home.tsx`(`<h1>나지르</h1>` 포함), `Process.tsx`(`무대에 오르기까지`), `Join.tsx`(`<나지르>와 함께하기`)도 같은 방식으로 제목만.

- [ ] **Step 3: `App.tsx` 라우트 작성**

```tsx
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Process from './pages/Process';
import Join from './pages/Join';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/process" element={<Process />} />
        <Route path="/join" element={<Join />} />
      </Routes>
    </Layout>
  );
}
```

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `npm test src/App.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add router and page shells"
```

---

## Task 9: 공통 UI 컴포넌트 (StatusChip · Accordion · CopyButton)

**Files:**
- Create: `src/components/StatusChip.tsx`, `src/components/Accordion.tsx`, `src/components/CopyButton.tsx`
- Test: `src/components/CopyButton.test.tsx`, `src/components/Accordion.test.tsx`

- [ ] **Step 1: CopyButton 테스트 작성**

`src/components/CopyButton.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  it('copies the value and shows confirmation label', async () => {
    render(<CopyButton value="3333-23-3584437" idleLabel="계좌번호 복사하기" doneLabel="복사되었습니다" />);
    const btn = screen.getByRole('button', { name: '계좌번호 복사하기' });
    await userEvent.click(btn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('3333-23-3584437');
    expect(await screen.findByRole('button', { name: '복사되었습니다' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test src/components/CopyButton.test.tsx`
Expected: FAIL ("Cannot find module './CopyButton'").

- [ ] **Step 3: `CopyButton.tsx` 작성**

```tsx
import { useRef, useState } from 'react';

export function CopyButton({ value, idleLabel, doneLabel, className }: {
  value: string; idleLabel: string; doneLabel: string; className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  async function copy() {
    try {
      await navigator.clipboard?.writeText(value);
    } finally {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={className ?? 'min-h-[48px] cursor-pointer bg-gold/[0.12] border border-gold/50 text-gold font-body text-sm font-medium rounded-sm hover:bg-gold/20 transition-colors'}
    >
      {copied ? doneLabel : idleLabel}
    </button>
  );
}
```

- [ ] **Step 4: Accordion 테스트 작성**

`src/components/Accordion.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('toggles content when the header is clicked', async () => {
    render(
      <Accordion label="헤더진" defaultOpen={false}>
        <p>연출 정은수</p>
      </Accordion>
    );
    expect(screen.queryByText('연출 정은수')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /헤더진/ }));
    expect(screen.getByText('연출 정은수')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: `Accordion.tsx` 작성**

```tsx
import { useState, type ReactNode } from 'react';

export function Accordion({ label, defaultOpen = false, children }: {
  label: string; defaultOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-velvet">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-[18px] py-4 flex justify-between items-center gap-3 text-left text-paper hover:bg-gold/[0.08] transition-colors"
      >
        <span className="font-display text-[18px]">{label}</span>
        <span className="font-mono text-sm text-gold">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-[18px] pb-5 flex flex-col gap-2.5">{children}</div>}
    </div>
  );
}
```

- [ ] **Step 6: `StatusChip.tsx` 작성 (테스트는 페이지 통합에서 커버)**

시안 `chip` 색 매핑을 옮긴다:

```tsx
import type { TimelineStatus } from '../content/types';

const styles: Record<TimelineStatus, string> = {
  '완료': 'text-paper bg-gold-deep border-gold-deep',
  '진행 중': 'text-gold-deep bg-gold-deep/15 border-gold-deep/60',
  '예정': 'text-paper/60 bg-transparent border-paper/25',
};

export function StatusChip({ status }: { status: TimelineStatus }) {
  return (
    <span className={`font-mono text-[10px] tracking-[0.1em] px-2 py-1 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
}
```

- [ ] **Step 7: 테스트 실행 (통과 확인)**

Run: `npm test src/components/CopyButton.test.tsx src/components/Accordion.test.tsx`
Expected: PASS (2 files).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add StatusChip, Accordion, and CopyButton"
```

---

## Task 10: 홈 페이지

**Files:**
- Modify: `src/pages/Home.tsx`
- Create: `src/components/Spotlight.tsx`, `src/components/Curtain.tsx`
- Test: `src/pages/Home.test.tsx`

- [ ] **Step 1: 홈 테스트 작성**

`src/pages/Home.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home', () => {
  it('renders title and three section cards', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: '나지르' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /에 대하여/ })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /무대에 오르기까지/ })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /함께하기/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: `Spotlight.tsx` 작성 (pointermove 배경)**

```tsx
import { useEffect, useRef } from 'react';

export function useSpotlight() {
  const spot = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!spot.current || !beam.current) return;
      const r = spot.current.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      if (x < -10 || x > 110) return;
      beam.current.style.background = `radial-gradient(420px circle at ${x}% ${y}%, rgba(233,185,73,.24), rgba(233,185,73,.07) 42%, transparent 70%)`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return { spot, beam };
}
```

참고: 이 파일은 훅 형태(`useSpotlight`)로 `spot`/`beam` ref를 반환한다(시안의 `setSpot`/`setBeam` 대응). Home에서 두 ref를 각 요소에 연결한다.

- [ ] **Step 3: `Home.tsx` 작성**

시안 홈 섹션(`isHome`)을 옮긴다: 성구 → `<h1>나지르</h1>` → 부제 → 제작 메타 → 3개 카드(`goAbout`/`goProcess`/`goJoin` → `<Link to>`). 배경 빔에 `Spotlight` 훅의 ref 연결, `animate-glow` 클래스 사용. 카드 3개는 시안의 `01/02/03` 라벨·제목·설명을 유지. 데이터는 `useContent()`에서 `site.heroVerse` 등 사용.

```tsx
import { Link } from 'react-router-dom';
import { useSpotlight } from '../components/Spotlight';
import { useContent } from '../lib/useContent';

const cards = [
  { to: '/about', n: '01', title: '<나지르>에 대하여', desc: '연출의 인사말 · 작품 소개' },
  { to: '/process', n: '02', title: '<나지르>가 무대에 오르기까지', desc: '제작 일정 · 함께하는 사람들 · 예산' },
  { to: '/join', n: '03', title: '<나지르>와 함께하기', desc: '후원 안내 · 기도 제목 · Q&A' },
];

export default function Home() {
  const { spot, beam } = useSpotlight();
  const state = useContent();
  const site = state.status === 'ready' ? state.data.site : undefined;
  return (
    <section>
      <div ref={spot} className="relative min-h-[min(88vh,760px)] flex flex-col justify-center items-center text-center px-5 py-[clamp(56px,10vw,120px)] overflow-hidden bg-stage">
        <div ref={beam} className="absolute -inset-[20%] pointer-events-none animate-glow" style={{ background: 'radial-gradient(420px circle at 50% 42%, rgba(233,185,73,.22), rgba(233,185,73,.06) 42%, transparent 70%)' }} />
        <p className="relative font-display text-[clamp(14px,3.4vw,18px)] leading-[2] text-paper/[0.66] max-w-[640px] mb-[clamp(32px,7vw,56px)]">{site?.heroVerse}</p>
        <h1 className="relative font-display font-bold text-[clamp(76px,22vw,200px)] leading-[0.92] tracking-[0.02em] m-0 text-paper" style={{ textShadow: '0 0 60px rgba(233,185,73,.28)' }}>나지르</h1>
        <p className="relative font-display text-[clamp(18px,5vw,32px)] tracking-[0.34em] mt-[clamp(14px,3vw,22px)] text-gold">구별된 사람들</p>
        <p className="relative font-mono text-[clamp(10px,2.6vw,12px)] tracking-[0.12em] text-paper/50 mt-[clamp(28px,6vw,44px)] leading-[2]">{site?.heroMeta}</p>
      </div>
      <div className="max-w-[1180px] mx-auto px-5 pt-[clamp(40px,8vw,80px)] pb-[clamp(90px,14vw,120px)] grid grid-cols-1 sm:grid-cols-3 gap-[clamp(8px,2vw,16px)]">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="text-left bg-velvet border border-gold/20 rounded-sm p-[clamp(24px,5vw,32px)] flex flex-col gap-3.5 text-paper hover:border-gold/55 hover:bg-velvet-2 transition-colors">
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

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `npm test src/pages/Home.test.tsx`
Expected: PASS.

- [ ] **Step 5: 브라우저 확인**

Run: `npm run dev` → `http://localhost:5173/` 열어 타이틀·카드·마우스 이동 시 스포트라이트 확인 후 종료.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement home page with spotlight"
```

---

## Task 11: 대하여(About) 페이지

**Files:**
- Modify: `src/pages/About.tsx`
- Test: `src/pages/About.test.tsx`

- [ ] **Step 1: About 테스트 작성**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from './About';

describe('About', () => {
  it('renders synopsis and all six characters', async () => {
    render(<About />);
    expect(await screen.findByText(/평생의 목표였던 오디션에서 탈락/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '아론' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '라이' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test src/pages/About.test.tsx`
Expected: FAIL(현재 골격은 제목만 있어 인물/시놉시스 없음).

- [ ] **Step 3: `About.tsx` 작성**

시안 `isAbout` 섹션을 옮긴다: 연출 인사말(사진 placeholder + `site.aboutGreeting` + 정은수) / Praysound 이야기(`praysoundStory1`,`praysoundStory2`) / 작품 개요(`site.facts` → `<dl>`) / LOGLINE·SYNOPSIS / 주요 등장인물(`characters` 카드, 각 사진 1:1 placeholder + `name` + `description`). 인물 카드 `<h4>`는 `role="heading"`로 잡히도록 `<h4>{c.name}</h4>` 사용. 데이터는 `useContent()`. 로딩 중에는 `null` 또는 간단한 로딩 표시.

핵심 인물 렌더 부분 예시:

```tsx
import { useContent } from '../lib/useContent';

export default function About() {
  const state = useContent();
  if (state.status !== 'ready') return <section className="max-w-[820px] mx-auto px-5 py-20 text-paper/60">불러오는 중…</section>;
  const { site, characters } = state.data;
  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(48px,9vw,88px)] pb-[clamp(100px,14vw,140px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">01 / ABOUT</p>
      <h2 className="font-display font-bold text-[clamp(30px,7.5vw,46px)] leading-[1.35] text-paper mb-[clamp(40px,8vw,64px)]">&lt;나지르&gt;에 대하여</h2>

      {/* 인사말 · Praysound 이야기 · 작품 개요 · LOGLINE/SYNOPSIS 는 시안 마크업을 옮긴다 */}
      <p className="font-display text-[clamp(19px,5vw,27px)] leading-[1.8] text-paper mb-9">{site.logline}</p>
      <p className="text-sm font-light leading-[2.15] text-paper/[0.78] mb-16">{site.synopsis}</p>

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

인사말/Praysound/작품개요/LOGLINE 블록은 시안 마크업(원본 99–134행)을 위 스타일 관례로 옮겨 채운다.

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `npm test src/pages/About.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement about page"
```

---

## Task 12: 무대에 오르기까지(Process) 페이지

**Files:**
- Modify: `src/pages/Process.tsx`
- Test: `src/pages/Process.test.tsx`

- [ ] **Step 1: Process 테스트 작성**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Process from './Process';

describe('Process', () => {
  it('renders the production timeline with a status chip', async () => {
    render(<Process />);
    expect(await screen.findByText('대본 작업')).toBeInTheDocument();
    // 상태칩(완료/진행 중/예정)이 하나 이상 렌더된다
    expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
  });
  it('shows budget total and expands a people group', async () => {
    render(<Process />);
    expect(await screen.findByText('₩ 9,000,000')).toBeInTheDocument();
    // 헤더진은 기본 펼침 상태 → 첫 멤버가 보인다
    expect(await screen.findByText(/연출 정은수/)).toBeInTheDocument();
    // 팀원 그룹을 펼치면 멤버가 보인다
    await userEvent.click(screen.getByRole('button', { name: /팀원/ }));
    expect(screen.getByText(/기획팀 김은성/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test src/pages/Process.test.tsx`
Expected: FAIL.

- [ ] **Step 3: `Process.tsx` 작성**

시안 `isProcess` 섹션을 옮긴다: 인트로(`site.processIntro`) / **제작 일정(`timeline`을 기간·제목·`StatusChip`으로, 시안 원본 162행 placeholder 자리)** / 함께 세우는 사람들(`peopleIntro` + 팀 사진 placeholder + `people` 그룹을 `Accordion`으로, 헤더진은 `defaultOpen`) / 제작 예산(`budgetTotal` + `budget` 항목 목록, 금액은 "미공개" + `budgetNote`). 멤버 텍스트는 `<p>`로 렌더.

```tsx
import { Accordion } from '../components/Accordion';
import { StatusChip } from '../components/StatusChip';
import { useContent } from '../lib/useContent';

export default function Process() {
  const state = useContent();
  if (state.status !== 'ready') return <section className="max-w-[900px] mx-auto px-5 py-20 text-paper/60">불러오는 중…</section>;
  const { site, timeline, people, budget } = state.data;
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

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `npm test src/pages/Process.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement process page"
```

---

## Task 13: 함께하기(Join) 페이지

**Files:**
- Modify: `src/pages/Join.tsx`
- Test: `src/pages/Join.test.tsx`

- [ ] **Step 1: Join 테스트 작성**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Join from './Join';

describe('Join', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  it('shows account number and support/qna links', async () => {
    render(<Join />);
    expect(await screen.findByText('3333-23-3584437')).toBeInTheDocument();
    const support = await screen.findByRole('link', { name: /후원 신청서/ });
    expect(support).toHaveAttribute('href', 'https://forms.gle/dtEFEf2E1ArqGEwH6');
    expect(await screen.findByRole('link', { name: /질문 · 응원 남기기/ })).toBeInTheDocument();
  });
  it('copies the account number', async () => {
    render(<Join />);
    await userEvent.click(await screen.findByRole('button', { name: /계좌번호 복사/ }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('3333-23-3584437');
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test src/pages/Join.test.tsx`
Expected: FAIL.

- [ ] **Step 3: `Join.tsx` 작성**

시안 `isJoin` 섹션을 옮긴다: 성구(`joinVerse`/`joinVerseRef`) / 후원(`supportIntro` + 후원폼 `<a href={supportFormUrl}>` + 계좌 박스(`accountBank`/`accountNumber`/`accountHolder`) + `CopyButton`) / 기도(`prayerIntro` + `prayers` 번호 목록) / Q&A(`qnaIntro` + `<a href={qnaUrl}>`).

```tsx
import { CopyButton } from '../components/CopyButton';
import { useContent } from '../lib/useContent';

export default function Join() {
  const state = useContent();
  if (state.status !== 'ready') return <section className="max-w-[760px] mx-auto px-5 py-20 text-paper/60">불러오는 중…</section>;
  const { site, prayers } = state.data;
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

- [ ] **Step 4: 테스트 실행 (통과 확인)**

Run: `npm test src/pages/Join.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement join page with account copy"
```

---

## Task 14: 커튼 오프닝 애니메이션

**Files:**
- Create: `src/components/Curtain.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/Curtain.test.tsx`

- [ ] **Step 1: Curtain 테스트 작성**

`src/components/Curtain.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Curtain } from './Curtain';

afterEach(() => vi.useRealTimers());

describe('Curtain', () => {
  it('removes itself after the opening delay', () => {
    vi.useFakeTimers();
    render(<Curtain />);
    expect(screen.getByTestId('curtain')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1800));
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

Run: `npm test src/components/Curtain.test.tsx`
Expected: FAIL ("Cannot find module './Curtain'").

- [ ] **Step 3: `Curtain.tsx` 작성**

```tsx
import { useEffect, useState } from 'react';

export function Curtain() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 1700);
    return () => clearTimeout(t);
  }, []);
  if (!on) return null;
  return (
    <div data-testid="curtain" className="fixed inset-0 z-[200] pointer-events-none">
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#100B14] to-[#241A2E] animate-curtainL shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#100B14] to-[#241A2E] animate-curtainR shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
    </div>
  );
}
```

- [ ] **Step 4: `App.tsx`에 Curtain 마운트**

`Layout` 바깥(최상단)에서 렌더하도록 `App.tsx`를 수정: `Routes` 위에 `<Curtain />` 추가하고 `Layout`은 그대로 감싼다. 예:

```tsx
import { Curtain } from './components/Curtain';
// ...
return (
  <>
    <Curtain />
    <Layout>
      <Routes>...</Routes>
    </Layout>
  </>
);
```

- [ ] **Step 5: 테스트 실행 (통과 확인)**

Run: `npm test src/components/Curtain.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add curtain opening animation"
```

---

## Task 15: 전체 검증 · 빌드

**Files:** 없음(검증만)

- [ ] **Step 1: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 파일 PASS.

- [ ] **Step 2: 타입 체크 + 프로덕션 빌드**

Run: `npm run build`
Expected: 타입 에러 없이 `dist/` 생성. 에러가 있으면 해당 파일을 고치고 다시 빌드.

- [ ] **Step 3: 빌드 결과 미리보기로 4개 경로 확인**

```bash
npm run preview
```

`/`, `/about`, `/process`, `/join`을 브라우저에서 열어 콘텐츠·반응형(모바일 폭)·계좌 복사·아코디언·커튼을 눈으로 확인 후 종료.

- [ ] **Step 4: README 갱신 + Commit**

`README.md`에 실행법(개발/테스트/빌드) 한 단락을 적고:

```bash
git add -A
git commit -m "docs: add run instructions to README"
```

---

## 후속 (별도 계획으로 진행)

- **Phase 2** — Supabase 테이블·RLS·Storage 생성, `src/content/data.ts` 값을 시드로 이관, `src/lib/content.ts`를 Supabase 호출로 교체. (화면 코드 변경 없음이 목표)
- **Phase 3** — 관리자 로그인(`/admin`) + 섹션별 편집 UI + 사진 업로드.

각 Phase는 이 계획이 끝난 뒤 별도 spec 확인 → plan → 실행 사이클로 진행한다.

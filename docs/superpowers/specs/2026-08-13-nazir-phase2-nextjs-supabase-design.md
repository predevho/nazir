# 〈나지르〉 Phase 2 — Next.js 전환 + Supabase 이관 설계 문서

- 작성일: 2026-08-13
- 상태: 승인됨 (구현 계획 단계로 진행 예정)
- 선행: Phase 1(Vite + React + TS 반응형 웹) 완료 · `main` @ 9c3f0b8
- 관련 문서: `2026-08-13-nazir-website-design.md`(전체 설계), `2026-08-13-nazir-phase1-react-port.md`(Phase 1 계획)

## 1. 배경 · 목적

Phase 1은 Vite + React + TypeScript SPA로 구현되어 동작 중이다. 이후 단계인
Supabase 연동(콘텐츠 DB)과 관리자 로그인(Phase 3)을 고려해, 프레임워크를
**Next.js(App Router)** 로 전환한다. Next.js는 `@supabase/ssr` 공식 지원, 서버
렌더(SEO·소셜 미리보기), 미들웨어 기반 인증으로 이후 단계와의 궁합이 좋다.

전환과 Supabase 이관을 한 번에 하면 검증이 어려우므로 **두 단계**로 나눈다.
각 단계는 그 자체로 동작·배포 가능한 상태를 목표로 한다.

### 이번 문서 범위
- **2A**: Vite → Next.js(App Router) 전환. 기능은 Phase 1과 동일, 데이터는 로컬 유지.
- **2B**: 콘텐츠를 Supabase로 이관(`@supabase/ssr`, 마이그레이션 SQL, 시드, 자동 폴백).

### 범위 제외 (별도 단계)
- 관리자 편집 기능·사진 업로드·로그인 → Phase 3
- 실제 Vercel 배포 파이프라인·도메인 연결 → 후속

## 2. 프레임워크 · 기술 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | **Next.js (App Router)** |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS (Phase 1 디자인 토큰 그대로 이관) |
| 백엔드 | Supabase (Postgres · Storage), 클라이언트 `@supabase/supabase-js` + `@supabase/ssr` |
| 테스트 | Vitest + React Testing Library (설정만 Next 환경에 맞게 조정) |
| 배포(상정) | Vercel 무료 티어 |

- Next.js·`@supabase/ssr`의 정확한 API/버전은 구현 계획 단계에서 최신 공식 문서로 확인한다(빠르게 변함).

## 3. 단계 2A — Next.js 전환 (기능 동일)

### 목표
Phase 1의 4개 페이지·컴포넌트·콘텐츠·인터랙션을 Next.js App Router 구조로 옮긴다.
데이터는 아직 로컬(`content/data.ts`) 유지. 전환 완료 시 현재와 동일하게 동작한다.

### 디렉터리 구조 (App Router)
```
app/
  layout.tsx          # 루트 레이아웃: <html lang="ko">, 폰트, 헤더/푸터, 커튼
  page.tsx            # / 홈
  about/page.tsx      # /about 대하여
  process/page.tsx    # /process 무대에 오르기까지
  join/page.tsx       # /join 함께하기
  globals.css         # Tailwind 지시자 + 전역 스타일(Phase 1 index.css 이관)
components/           # Header, Footer, StatusChip, Accordion, CopyButton, Curtain, Spotlight
content/              # types.ts, data.ts (Phase 1에서 그대로 이관)
lib/                  # content.ts (데이터 접근 계층)
```

### 재사용 (거의 그대로)
- Tailwind 토큰 설정(`tailwind.config`), 색·폰트·애니메이션
- `content/types.ts`, `content/data.ts`(문구·인물·일정·예산·기도제목·명단)
- 컴포넌트 마크업/Tailwind 클래스, 페이지 본문 구조
- 폰트: 기존 Google Fonts 링크 유지(또는 `next/font`는 후속 최적화)

### 교체 · 수정
- **라우팅**: react-router(`BrowserRouter`/`Routes`/`Link`/`NavLink`) → App Router 폴더 라우팅 + `next/link`, 활성 표시는 `usePathname()`.
- **클라이언트 컴포넌트 지정**: 상태·이벤트·브라우저 API를 쓰는 컴포넌트에 `'use client'` — Spotlight(pointermove), CopyButton(clipboard), Accordion(useState), Curtain(setTimeout), 데이터 로딩 훅. 순수 표시 컴포넌트(Footer 등)는 서버 컴포넌트로 유지 가능.
- **레이아웃**: `App.tsx`의 Layout/Curtain 조합 → `app/layout.tsx`.
- **빌드**: Vite 제거, Next 빌드(`next dev`/`next build`)로 교체. `index.html`은 App Router에선 불필요(메타데이터는 `metadata` API/`layout.tsx`).
- **테스트**: Vitest + RTL 유지. 라우터 의존 테스트(`MemoryRouter`)는 Next 방식으로 조정하거나 컴포넌트 단위 테스트로 대체. 인터랙션 테스트(CopyButton·Accordion·Curtain)는 그대로 유효.

### 데이터
- 2A에서는 `lib/content.ts`가 로컬 데이터를 반환(현행 유지). 서버 컴포넌트에서 직접 호출하는 형태로 정리(추후 Supabase로 교체 시 이 계층만 변경).

## 4. 단계 2B — Supabase 이관

### 데이터 접근
- 공개 콘텐츠 읽기는 **서버 컴포넌트**에서 `@supabase/ssr`의 서버 클라이언트로 수행(anon key, 공개 읽기).
- `lib/content.ts`(또는 `lib/content.server.ts`)가 Supabase에서 읽어 Phase 1과 **동일한 타입(AllContent)** 으로 반환 → 페이지 코드 변경 최소화.

### 데이터 모델 (마이그레이션 SQL)
전체 설계 문서 §4와 동일:
- `content_blocks(key text pk, value text, updated_at)` — 단일 문구·링크·계좌 등
- `characters(id, name, description, photo_url, sort_order, updated_at)`
- `timeline_events(id, period, title, status, sort_order, updated_at)`
- `budget_items(id, name, sort_order, updated_at)`
- `prayers(id, text, sort_order, updated_at)`
- `people_groups(id, label, sort_order)` + `people_members(id, group_id fk, text, sort_order)`
- Storage 버킷 `images`(공개 읽기)
- **RLS**: 모든 콘텐츠 테이블·버킷 공개 읽기(anon select) 허용, 쓰기는 인증 사용자만(관리자 전용, Phase 3에서 사용).

### 적용 방식 (사용자 협조 필요)
- 제가 마이그레이션 SQL과 시드 SQL을 `supabase/` 폴더에 작성.
- 사용자가 supabase.com에서 프로젝트 생성 후 **대시보드 SQL Editor에 SQL 적용**(또는 Supabase CLI).
- 사용자가 **프로젝트 URL + anon key**를 `.env.local`에 넣음(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

### 시드
- `content/data.ts`의 값을 **시드 SQL**로 변환(문구·인물·일정·예산·기도제목·명단). 한글 텍스트를 SQL에 정확히 이스케이프.

### 자동 폴백
- 환경변수가 설정돼 있으면 Supabase에서 읽고, **없으면 로컬 `content/data.ts`로 폴백**.
- 효과: 자격증명 전에도 사이트 동작, 테스트(Vitest)는 네트워크 없이 로컬 데이터로 통과, 준비되면 `.env.local`만 채우면 Supabase 모드로 전환.
- `content/data.ts`는 "시드 원본 + 폴백 데이터"로 계속 유지.

## 5. 아키텍처 경계

- `content/` — 타입 + 로컬(시드/폴백) 데이터
- `lib/supabase/` — SSR 서버/브라우저 클라이언트 팩토리
- `lib/content.ts` — Supabase 우선, 미설정 시 로컬 폴백. 화면은 이 계층에만 의존
- `components/` — 표시 컴포넌트(가능하면 서버), 인터랙티브는 `'use client'`
- `app/` — 라우트·레이아웃
- 페이지는 데이터 출처(로컬/Supabase)를 모르고 `lib/content.ts` 인터페이스에만 의존 → 2A→2B 전환 시 페이지 변경 최소화

## 6. 테스트 · 에러 처리

- Vitest + RTL로 페이지 렌더·인터랙션(계좌 복사·아코디언·커튼) 검증 유지.
- Supabase 경로는 폴백 덕분에 자격증명 없이도 로컬 데이터로 렌더/테스트 가능.
- 데이터 로딩 실패 시 사용자 친화적 처리(폴백 또는 에러 표시).
- `prefers-reduced-motion` 대응 유지.

## 7. 마이그레이션 리스크 · 유의

- Next.js App Router / `@supabase/ssr`는 API가 자주 바뀌므로 **구현 계획 단계에서 최신 공식 문서(Context7)로 정확한 사용법 확인**.
- 라우터 의존 테스트는 재작성 필요.
- Vite 전용 설정(`vite.config.ts`, `index.html`)은 제거되고 Next 설정으로 대체됨.
- 커밋 메시지는 한글 + 타입 접두사(`feat:`/`fix:`/`docs:`/`chore:`/`test:`) 유지.

## 8. 진행 순서 요약

1. **2A**: Next.js 프로젝트 전환 → 4페이지·컴포넌트·인터랙션 이식(로컬 데이터) → 테스트·빌드 통과 → 동작 확인
2. **2B**: Supabase 마이그레이션/시드 SQL 작성 + `@supabase/ssr` 연동 + 자동 폴백 → 사용자 SQL 적용 + `.env.local` 설정 후 Supabase 모드 확인
3. (후속) **Phase 3**: 관리자 로그인·편집·사진 업로드

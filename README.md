# 나지르 (NAZIR)

창작 뮤지컬 〈나지르〉 소개·후원 안내 웹사이트. 제작 PRAYSOUND.

모바일 우선 반응형 웹. **Next.js(App Router) + TypeScript + Tailwind CSS**로 구현했습니다.

## 실행

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:3000)
npm test         # 테스트 (Vitest)
npm run build    # 프로덕션 빌드 (next build)
npm start        # 프로덕션 서버
```

## 구조

| 경로 | 설명 |
|------|------|
| `app/` | App Router — `layout.tsx`(공통 레이아웃·폰트·헤더/푸터/커튼), `page.tsx`(홈), `about/`·`process/`·`join/` |
| `content/` | 콘텐츠 타입(`types.ts`)과 데이터(`data.ts`) |
| `lib/content.ts` | 데이터 접근 계층(`getContent`) — 현재 로컬 데이터, 이후 Supabase로 교체 예정 |
| `components/` | 공통 UI (Header, Footer, StatusChip, Accordion, CopyButton, Curtain, Spotlight, HeroBackdrop) |

페이지는 **서버 컴포넌트**로 `await getContent()`를 호출하고, 인터랙티브 요소(계좌 복사·아코디언·커튼·스포트라이트·헤더)만 `'use client'`입니다. 데이터 출처가 바뀌어도 페이지는 `lib/content.ts`에만 의존합니다.

## 라우팅

- `/` 홈 · `/about` 대하여 · `/process` 무대에 오르기까지 · `/join` 함께하기

## 로드맵

- **Phase 1 (완료)** — 시안을 React 반응형 웹으로 이식
- **Phase 2A (완료)** — Next.js(App Router)로 전환
- **Phase 2B** — 콘텐츠를 Supabase(DB·Storage)로 이관 (`@supabase/ssr`, 자동 폴백)
- **Phase 3** — 관리자 편집 기능(텍스트·사진), Supabase Auth 로그인

설계·계획 문서: `docs/superpowers/`

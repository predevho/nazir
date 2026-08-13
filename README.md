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

## Supabase 연결 (선택)

자격증명이 없으면 사이트는 로컬 데이터(`content/data.ts`)로 동작합니다(자동 폴백). Supabase를 연결하면 콘텐츠를 DB에서 읽습니다.

연결 순서:

1. [supabase.com](https://supabase.com)에서 프로젝트 생성(무료 티어).
2. 대시보드 SQL Editor에서 `supabase/migrations/0001_init.sql` 전체를 실행(스키마·RLS·이미지 버킷 생성).
3. 이어서 `supabase/seed.sql`을 실행(현재 콘텐츠 입력, 재실행 가능).
4. 프로젝트의 Project Settings > API에서 Project URL과 anon(public) key를 복사.
5. 프로젝트 루트에 `.env.local` 생성 후 `.env.example`을 참고해 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력.
6. `npm run dev`(또는 재빌드) → 콘텐츠가 Supabase에서 로드됨. 관리자 수정은 ISR로 최대 60초 내 반영.

참고: 지금은 사진 업로드가 없어 인물 사진은 비어 있습니다(Phase 3에서 추가).

## 라우팅

- `/` 홈 · `/about` 대하여 · `/process` 무대에 오르기까지 · `/join` 함께하기

## 로드맵

- **Phase 1 (완료)** — 시안을 React 반응형 웹으로 이식
- **Phase 2A (완료)** — Next.js(App Router)로 전환
- **Phase 2B (완료)** — 콘텐츠를 Supabase(DB·Storage)로 이관 (`@supabase/ssr`, 자동 폴백)
- **Phase 3** — 관리자 편집 기능(텍스트·사진), Supabase Auth 로그인

설계·계획 문서: `docs/superpowers/`

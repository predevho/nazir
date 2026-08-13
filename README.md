# 나지르 (NAZIR)

창작 뮤지컬 〈나지르〉 소개·후원 안내 웹사이트. 제작 PRAYSOUND.

모바일 우선 반응형 웹. **Vite + React + TypeScript + Tailwind CSS**로 구현했습니다.

## 실행

```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 (http://localhost:5173)
npm test         # 테스트 (Vitest)
npm run build    # 프로덕션 빌드 (tsc + vite → dist/)
npm run preview  # 빌드 결과 미리보기
```

## 구조

| 경로 | 설명 |
|------|------|
| `src/content/` | 콘텐츠 타입(`types.ts`)과 데이터(`data.ts`) |
| `src/lib/` | 데이터 접근 계층(`content.ts`, `useContent.ts`) |
| `src/components/` | 공통 UI (Header, Footer, Layout, StatusChip, Accordion, CopyButton, Curtain, Spotlight) |
| `src/pages/` | 페이지 4종 (Home, About, Process, Join) |

화면은 데이터 출처를 모르고 `src/lib/content.ts`(비동기)에만 의존합니다.
현재는 로컬 데이터를 반환하며, 이후 이 파일만 Supabase 연동으로 교체하면 됩니다.

## 라우팅

- `/` 홈 · `/about` 대하여 · `/process` 무대에 오르기까지 · `/join` 함께하기

## 로드맵

- **Phase 1 (완료)** — 시안을 React 반응형 웹으로 이식
- **Phase 2** — 콘텐츠를 Supabase(DB·Storage)로 이관
- **Phase 3** — 관리자 편집 기능(텍스트·사진), Supabase Auth 로그인

설계·계획 문서: `docs/superpowers/`

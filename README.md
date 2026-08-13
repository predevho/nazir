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
| `lib/content.ts` | 데이터 접근 계층(`getContent`) — Supabase 우선, env 없으면 로컬 데이터로 폴백 |
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

## 관리자

관리자 인증과 단일 문구 편집이 추가되었습니다. `/admin`은 로그인해야 접근할 수 있고, 미인증 시 `/admin/login`으로 이동합니다.

**로그인은 이메일이 아니라 "아이디"로 합니다.** 사용자는 아이디만 입력하고, 앱이 내부적으로 `<아이디>@nazir.local`로 변환해 Supabase Auth에 로그인합니다(보안 처리는 Supabase Auth 그대로). 예: 아이디 `nazir1234` → 내부 이메일 `nazir1234@nazir.local`.

- **계정 생성**: Supabase 대시보드 → Authentication → Users → **Add user**.
  - 이메일 칸에 **`<아이디>@nazir.local`** 을 입력(예: `nazir1234@nazir.local`). 아이디는 **소문자**로.
  - **Auto Confirm User**를 켜서 생성(실제 메일 발송 없음).
  - 비밀번호 설정. 공개 가입은 사용하지 않습니다(권장: Authentication 설정에서 Sign up 비활성화).
- **로그인**: `/admin/login`에서 **아이디 + 비밀번호**(도메인 없이 아이디만) → `/admin` 대시보드 진입. 로그아웃 버튼 제공.
- **확인 절차**: 계정 생성 후 `npm run dev` → `/admin` 접속 시 로그인 페이지로 이동 → 아이디로 로그인 → 대시보드에 아이디 표시 → 로그아웃까지 확인.
- 쓰기 권한은 로그인 세션 + RLS "auth write" 정책으로 처리합니다(`service_role` 키 미사용).
- 내부 도메인은 `lib/adminUsername.ts`의 `ADMIN_EMAIL_DOMAIN`에서 바꿀 수 있습니다.

**콘텐츠 편집 (Phase 3B-1):** `/admin` 허브 → **단일 문구 편집**(`/admin/content`)에서 인사말·시놉시스·공연 날짜·계좌·외부 링크 등 단일 문구(content_blocks)를 수정하고 저장하면 공개 페이지에 **즉시 반영**됩니다(`revalidatePath`).

- 편집은 **Supabase 연결 상태에서만** 동작합니다(미연결이면 로컬 데이터로 표시만, 저장 불가).
- 인물·일정·예산·명단 등 **목록 편집**과 **사진 업로드**는 다음 단계(3B-2, 3C)에서 추가됩니다.
- 편집 필드 구성은 `lib/adminFields.ts`에서 라벨·섹션을 관리합니다.

## 라우팅

- `/` 홈 · `/about` 대하여 · `/process` 무대에 오르기까지 · `/join` 함께하기

## 로드맵

- **Phase 1 (완료)** — 시안을 React 반응형 웹으로 이식
- **Phase 2A (완료)** — Next.js(App Router)로 전환
- **Phase 2B (완료)** — 콘텐츠를 Supabase(DB·Storage)로 이관 (`@supabase/supabase-js`, 자동 폴백, ISR)
- **Phase 3A (완료)** — 관리자 인증(`@supabase/ssr` 로그인·로그아웃, `/admin` 보호)
- **Phase 3B-1 (완료)** — 관리자 셸 + 단일 문구 편집(저장 시 즉시 반영)
- **Phase 3B-2** — 목록 편집(인물·일정·예산·기도제목·명단 CRUD)
- **Phase 3C** — 사진 업로드(Storage `images`)

설계·계획 문서: `docs/superpowers/`

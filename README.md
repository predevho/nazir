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

### 추가 마이그레이션

- **`0002_people_individuals.sql` (참여자 개인화)** — 참여자 명단을 개인 단위(역할·이름·약력·사진)로 재구성합니다. 이미 0001+seed를 적용한 프로젝트라면 대시보드 SQL Editor에서 **1회** 실행하세요.
- ⚠️ **중요**: 이 마이그레이션을 적용하기 전에는, 새 코드가 `people_members`의 새 컬럼을 조회하다 실패해 **전체 콘텐츠가 로컬 시드 데이터로 폴백**됩니다(사이트는 정상 동작하지만 관리자 수정분이 보이지 않음). 배포 후 **곧바로 0002를 실행**하세요.
- **`0003_storage_write_policies.sql` (사진 교체·삭제)** — `images` 버킷에 authenticated **UPDATE·DELETE** 정책을 추가해 사진 덮어쓰기와 제거를 허용합니다(기존 public read·auth insert는 유지). 대시보드 SQL Editor에서 **1회** 실행하세요. 미적용 시 사진 업로드(덮어쓰기)·제거가 실패합니다.
- **`0004_people_team_tagline.sql` (세부팀·한줄소개)** — `people_members`에 `team`·`tagline` 컬럼을 추가하고, 팀원(g1)의 기존 `role`(팀명)을 `team`으로 이동합니다(`role`은 비움). 대시보드 SQL Editor에서 **1회** 실행하세요. ⚠️ **미적용 상태로 배포하면** 새 코드가 없는 컬럼을 조회하다 실패해 **전체 콘텐츠가 로컬 시드로 폴백**됩니다 — 배포 직전/직후 반드시 실행하세요.

참고: 사진 업로드는 Phase 3C에서 구현되었습니다(관리자 편집기에서 등장인물·참여자 사진을 업로드하면 공개 카드에 표시).

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
- 편집 필드 구성은 `lib/adminFields.ts`에서 라벨·섹션을 관리합니다.

**목록 편집 (Phase 3B-2):** `/admin` 허브 → 각 목록(`/admin/lists/[목록]`)에서 **작품 개요·주요 등장인물·제작 일정·제작 예산·기도제목**을 행 단위로 추가/수정/삭제/순서변경(↑↓) 후 저장하면 즉시 반영됩니다.

- 목록 구성은 `lib/adminLists.ts`(테이블·컬럼)에서 관리하며, 이 레지스트리가 서버 저장의 화이트리스트 역할을 합니다.
- 주요 등장인물은 이름·설명과 **사진**을 편집합니다(사진 선택 시 즉시 업로드, 저장 시 URL 반영).

**참여자 명단 편집 (Phase 3B-3b):** `/admin` 허브 → **참여자 명단**(`/admin/lists/people`)에서 그룹(헤더진·팀원·배우 등)과 각 개인(역할·**세부팀**·이름·**한 줄 소개**·약력·사진)을 추가/수정/삭제/순서변경 후 저장하면 즉시 반영됩니다. 그룹 삭제 시 소속 개인도 함께 삭제됩니다.

**참여자 세부팀·개인 상세페이지:** 공개 `process` 페이지에서 헤더진·팀원은 **세부팀(연출팀·기획팀…)** 소제목으로 묶여 표시되고, 각 개인의 사진·이름을 클릭하면 **개인 상세페이지 `/people/[id]`**(대형 사진·소속·한 줄 소개·약력)로 이동합니다. 세부팀은 각 개인의 `team` 값으로 그룹핑합니다(빈 값은 소제목 없이 표시). `0004` 마이그레이션 적용 필요.

- 사진은 각 개인 행에서 파일 선택 시 즉시 업로드(브라우저 압축 → Storage)되고, 저장 시 URL이 반영됩니다.

**약력·설명 서식 (Phase 3B-4·3B-5):** 공개 페이지의 약력·설명은 마크다운으로 렌더됩니다(불릿·강조·링크). `components/MarkdownText.tsx`(`react-markdown`).

**사진 업로드 (Phase 3C):** 등장인물·참여자 편집기에서 사진을 선택하면 브라우저에서 WebP로 압축(긴 변 1200px)한 뒤 Storage `images` 버킷의 고정 경로(`characters|people/{id}.webp`)에 즉시 업로드하고, 저장 시 `photo_url`이 반영됩니다. '사진 제거'는 Storage 파일을 삭제하고 URL을 비웁니다. 공개 카드는 일반 `<img loading="lazy">`로 표시합니다. `app/admin/lists/PhotoField.tsx`, `lib/image/*`. **`0003` 마이그레이션 적용 필요.**

- **참여자 약력**: 관리자 편집기에서 **항목별로 한 줄씩 추가**합니다(마크다운 문법 불필요). 각 항목은 자동으로 **• 불릿**으로 표시됩니다(경력 리스트 등에 적합). 내부 저장은 `- 항목` 형식.
- **주요 등장인물 설명**: 산문형이라 마크다운 텍스트 영역으로 작성합니다(불릿이 필요하면 `- ` 직접).

## 라우팅

- `/` 홈 · `/about` 대하여 · `/process` 무대에 오르기까지 · `/join` 함께하기

## 로드맵

- **Phase 1 (완료)** — 시안을 React 반응형 웹으로 이식
- **Phase 2A (완료)** — Next.js(App Router)로 전환
- **Phase 2B (완료)** — 콘텐츠를 Supabase(DB·Storage)로 이관 (`@supabase/supabase-js`, 자동 폴백, ISR)
- **Phase 3A (완료)** — 관리자 인증(`@supabase/ssr` 로그인·로그아웃, `/admin` 보호)
- **Phase 3B-1 (완료)** — 관리자 셸 + 단일 문구 편집(저장 시 즉시 반영)
- **Phase 3B-2 (완료)** — 목록 편집(작품 개요·인물·일정·예산·기도제목 CRUD)
- **Phase 3B-3a (완료)** — 참여자 명단 개인화(역할·이름·약력·사진 데이터·카드 표시)
- **Phase 3B-3b (완료)** — 참여자 명단 편집(그룹+개인 중첩 CRUD)
- **Phase 3B-4 (완료)** — 약력·설명 마크다운 렌더
- **Phase 3B-5 (완료)** — 참여자 약력 항목별 입력(자동 불릿)
- **Phase 3C (완료)** — 사진 업로드(등장인물·참여자, 브라우저 압축 → Storage `images`, 공개 카드 표시)
- **참여자 세부팀 + 개인 상세페이지 (완료)** — 헤더진·팀원 세부팀 그룹핑, 개인 상세 라우트 `/people/[id]`, team·tagline 필드(마이그레이션 `0004`)

설계·계획 문서: `docs/superpowers/`

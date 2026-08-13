# 〈나지르〉 Phase 3A — 관리자 인증 설계 문서

- 작성일: 2026-08-13
- 상태: 승인됨 (구현 계획 단계로 진행)
- 선행: Phase 2B(Supabase 이관) 완료 · `main` @ fef984e · Supabase 실연결 확인됨
- 관련: `2026-08-13-nazir-phase2-nextjs-supabase-design.md`(상위), 전체 설계 §5

## 1. 목적 · 범위

Phase 3 전체(관리자 인증 + 콘텐츠 편집 + 사진 업로드)는 규모가 커서 3A/3B/3C로 분해한다.
**3A는 인증 기반**만 구축한다: 로그인/로그아웃, `/admin` 경로 보호. 실제 편집 UI(3B)와
사진 업로드(3C)는 이 위에 얹는다.

### 포함
- `@supabase/ssr` 쿠키 세션(서버·브라우저·미들웨어 클라이언트)
- 로그인 페이지 `/admin/login`(이메일+비밀번호), 로그아웃
- 미들웨어로 `/admin/*` 보호 + 세션 쿠키 갱신
- `/admin` 대시보드 자리(로그인 시 이메일 표시 + 로그아웃) — 편집 기능은 3B

### 제외 (후속)
- 콘텐츠 편집 UI, on-demand revalidation → 3B
- 사진 업로드 → 3C
- 비밀번호 재설정·이메일 인증 플로우(필요 시 후속)

### 사용자 협조
- Supabase 대시보드 → Authentication → Users → **Add user**로 관리자 계정(이메일+비밀번호) 생성.
- 권장: Authentication → Providers/Settings에서 **공개 Sign up 비활성화**(지정 관리자만).

## 2. 아키텍처

- **`@supabase/ssr`** 로 쿠키 기반 세션. 클라이언트 헬퍼 3종:
  - `lib/supabase/server.ts` — 서버 컴포넌트/액션용(쿠키 read/write). anon key.
  - `lib/supabase/client.ts` — 브라우저용(로그인 폼).
  - `lib/supabase/middleware.ts` — 미들웨어에서 세션 갱신 + 요청/응답 쿠키 동기화.
- 기존 **2B의 공개 읽기 클라이언트**(`lib/supabase.ts`, 쿠키리스 anon)는 **그대로 유지** — 공개 페이지는 계속 ISR로 동작.
- `middleware.ts`(루트) — 모든 요청에서 세션 갱신, `/admin`(로그인 페이지 제외)에 세션 없으면 `/admin/login`으로 리다이렉트.
- 공개 페이지(`/`, `/about`, `/process`, `/join`)는 영향 없음(ISR·쿠키리스 유지).

## 3. 라우트

- `/admin/login` — 로그인 폼(이메일+비밀번호). 이미 로그인 상태면 `/admin`으로.
- `/admin` — 보호된 대시보드(3A: 이메일 표시 + 로그아웃 버튼, 자리표시).
- 로그아웃 — 서버 액션 또는 라우트 핸들러로 `signOut` 후 `/admin/login`.

## 4. 인증 흐름

1. 관리자가 `/admin` 접근 → 미들웨어가 세션 확인 → 없으면 `/admin/login` 리다이렉트.
2. 로그인 폼 제출 → 브라우저 클라이언트 `signInWithPassword(email, password)` → 성공 시 세션 쿠키 설정 → `/admin`으로 이동.
3. 이후 요청은 미들웨어가 세션 쿠키를 갱신(만료 방지).
4. 로그아웃 → `signOut` → 쿠키 삭제 → `/admin/login`.

- 쓰기 권한: 로그인 세션의 JWT가 서버 클라이언트를 통해 전달되어 RLS "auth write" 정책을 통과(3B에서 사용).

## 5. 보안

- 관리자 계정은 대시보드에서만 생성(공개 가입 없음). Sign up 비활성화 권장.
- `service_role` 키 사용 안 함 — 모든 쓰기는 로그인 사용자 세션 + RLS로.
- 로그인 실패 시 일반적 오류 메시지(계정 존재 여부 노출 최소화).
- 미들웨어는 `/admin`만 보호(공개 페이지는 통과).
- env: 기존 `NEXT_PUBLIC_SUPABASE_URL`·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 재사용.

## 6. 테스트

- 미들웨어/보호 로직: 세션 없을 때 `/admin` → `/admin/login` 리다이렉트(단위 또는 로직 테스트).
- 로그인 폼 렌더(이메일·비밀번호 입력, 제출 버튼).
- 공개 페이지 회귀: 기존 테스트 계속 통과(공개 읽기 폴백 경로 영향 없음).
- 실제 로그인 왕복은 사용자가 관리자 계정 생성 후 확인(문서에 절차 명시).

## 7. 유의

- `@supabase/ssr`(및 Next 미들웨어 쿠키 처리) API는 자주 바뀌므로 **구현 계획 단계에서 최신 공식 문서(Context7)로 정확한 사용법 확인**.
- 커밋 메시지는 한글 + 타입 접두사.

## 8. 진행 순서 요약

1. `@supabase/ssr` 설치 + 클라이언트 헬퍼 3종(server/client/middleware)
2. `middleware.ts`로 세션 갱신 + `/admin` 보호
3. `/admin/login` 페이지(로그인 폼) + 로그인 동작
4. `/admin` 대시보드 자리 + 로그아웃
5. 테스트 + README에 관리자 계정 생성·로그인 안내
6. (후속) 3B 콘텐츠 편집, 3C 사진 업로드

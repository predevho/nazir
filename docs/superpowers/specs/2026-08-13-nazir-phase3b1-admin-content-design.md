# 〈나지르〉 Phase 3B-1 — 관리자 셸 + 단일 문구 편집 설계 문서

- 작성일: 2026-08-13
- 상태: 승인됨 (구현 계획 단계로 진행)
- 선행: Phase 3A(관리자 인증) 완료 · `main` @ 627c27e · 아이디 로그인 동작 확인
- 관련: 전체 설계 §5, 3A 설계 문서

## 1. 목적 · 범위

Phase 3B(관리자 콘텐츠 편집)를 둘로 나눈 첫 단계. **단일 문구(content_blocks)** 편집과
그 기반이 되는 **관리자 전용 레이아웃 · 저장/즉시반영 패턴**을 만든다. 목록(facts·인물·
일정·예산·기도제목·명단) CRUD는 3B-2.

### 포함
- route group으로 공개 chrome와 관리자 셸 분리
- `/admin` 허브(편집 링크 + 로그아웃)
- `/admin/content` 단일 문구 편집(content_blocks ~26개, 섹션별 한글 라벨)
- 저장: 로그인 세션 서버 액션 → content_blocks upsert(RLS auth write) → `revalidatePath`로 즉시 반영
- 저장 성공/실패 피드백

### 제외 (3B-2 / 이후)
- 목록(facts·characters·timeline·budget·prayers·people) CRUD, 순서변경
- 사진 업로드(3C)

### 전제 · 제약
- 편집은 **Supabase 연결 상태에서만** 동작(런타임에 로컬 `content/data.ts`는 수정 불가). 미연결 시 안내 표시.
- 실제 저장 왕복은 로그인 후 사용자가 확인. 여기서는 코드 + 폼/설정 렌더 테스트 + 액션 로직(목) + 빌드로 검증.

## 2. 레이아웃 구조 (route groups)

- `app/layout.tsx` — **최소 루트**: `<html lang="ko">`, 폰트 링크, `<body>`(다크 배경 클래스), metadata. 공개 chrome 없음.
- `app/(site)/layout.tsx` — **공개 셸**: Curtain + Header + `<main>` + Footer(site). `getContent()`로 footer 데이터. 공개 페이지를 감싼다.
- 공개 페이지 이동(URL 불변): `app/page.tsx`→`app/(site)/page.tsx`, `about`/`process`/`join` 동일.
- `app/admin/layout.tsx` — **관리자 셸**: 간단한 상단바("나지르 · 관리자") + `{children}`. 공개 헤더/푸터/커튼 없음. (로그인/허브/편집이 이 안에서 렌더)

효과: `/admin/*`은 공개 chrome 없이 깔끔한 관리자 화면. 공개 페이지는 그대로.

## 3. 라우트

- `/admin` — 허브(서버). 로그인 확인 → 환영 + "단일 문구 편집"(`/admin/content`) 링크 + 로그아웃.
- `/admin/content` — 단일 문구 편집(서버에서 현재 값 로드 → 클라이언트 폼).
- `/admin/login` — 기존 로그인(3A).

## 4. 편집 대상 · 필드 설정

- 편집 대상: `content_blocks`의 단일 문구 = `SiteContent`의 문자열 필드 26개(facts 제외).
- **필드 설정**(`lib/adminFields.ts`): 각 key에 대해 `{ key, label(한글), section, multiline }`. 섹션은 히어로 / 대하여 / 무대에 오르기까지 / 함께하기 / 푸터.
- 예: `accountNumber`→"계좌번호", `supportFormUrl`→"후원 신청서 링크(URL)", `aboutGreeting`→"연출의 인사말"(multiline), `synopsis`→"시놉시스"(multiline).
- 이 설정으로 폼을 섹션별로 렌더(단문=input, 장문=textarea).

## 5. 저장 · 반영

- 서버 액션 `saveContent(prevState, formData)`:
  1. `@supabase/ssr` 서버 클라이언트로 `getUser()` 확인(미인증 → `/admin/login`).
  2. 필드 설정 순회하며 `content_blocks` upsert(key·value·updated_at). RLS "auth write"가 인증 사용자만 허용.
  3. `revalidatePath('/', 'layout')`로 공개 페이지 즉시 갱신(ISR 60초 대기 없이 반영).
  4. `{ ok, message }` 반환 → 폼에서 피드백.
- 폼은 React 19 `useActionState`로 pending·결과 처리.

## 6. 보안

- 편집 화면·저장 액션 모두 로그인 필요(미들웨어 + 액션 내 getUser 이중 확인).
- 쓰기는 로그인 세션 + RLS만. `service_role` 미사용.
- 입력값은 문자열로 저장(콘텐츠 텍스트). URL 필드는 최소 형식 힌트(강제 검증은 가볍게).

## 7. 테스트

- `lib/adminFields.ts` 완성도: 26개 키가 `SiteContent` 문자열 필드와 일치(누락/추가 없음).
- 편집 폼 렌더: 섹션·라벨(예: "계좌번호", "시놉시스")과 저장 버튼 표시.
- 저장 액션 로직: 서버 클라이언트를 목으로 대체해 upsert 호출·성공/실패 반환 검증.
- 공개 페이지 회귀: route group 이동 후에도 `/`·`/about`·`/process`·`/join` 정상(기존 테스트 유지, import 경로만 조정).

## 8. 유의

- route group 이동 시 페이지 파일의 `@/` import는 유지(별칭이라 이동 무관), 테스트의 상대 import는 경로 조정 필요.
- `revalidatePath`는 서버 액션에서 호출.
- 커밋 메시지 한글 + 타입 접두사.

## 9. 진행 순서 요약

1. route group 분리(최소 root + (site) 셸 + admin 셸, 공개 페이지 이동)
2. `lib/adminFields.ts`(필드 설정) + 완성도 테스트
3. `/admin/content` 편집 폼 + `saveContent` 서버 액션(upsert + revalidate) + 테스트
4. `/admin` 허브(링크 + 로그아웃) 구성
5. 검증 + README 갱신
6. (후속) 3B-2 목록 편집, 3C 사진 업로드

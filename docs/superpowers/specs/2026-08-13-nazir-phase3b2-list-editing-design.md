# 〈나지르〉 Phase 3B-2 — 목록 편집(단순 5종) 설계 문서

- 작성일: 2026-08-13
- 상태: 승인됨 (구현 계획 단계로 진행)
- 선행: Phase 3B-1(관리자 셸 + 단일 문구 편집) 완료 · `main` @ 9818023
- 관련: 3B-1 설계, 전체 설계 §5

## 1. 목적 · 범위

관리자가 **단순 목록** 콘텐츠를 추가/수정/삭제/순서변경할 수 있게 한다. 형태가
비슷한 5종을 **재사용 편집기 하나**로 처리한다. 중첩 구조인 참여자 명단(people)은
별도(3B-3).

### 포함 (단순 목록 5종)
- 작품 개요 `facts` (라벨/값)
- 주요 등장인물 `characters` (이름/설명 — 사진은 3C)
- 제작 일정 `timeline_events` (기간/제목/상태 select)
- 제작 예산 항목 `budget_items` (항목명)
- 기도제목 `prayers` (내용)

각 목록: 행 추가 / 값 수정 / 삭제 / 순서변경(↑↓) → **한 번에 저장** → 즉시 반영.

### 제외
- 참여자 명단 people(중첩) → 3B-3
- 사진 업로드 → 3C

### 전제 · 제약
- 편집은 Supabase 연결 상태에서만 동작.
- 실제 저장 왕복은 로그인 후 확인. 여기서는 코드 + 레지스트리/편집기 렌더·상호작용 테스트 + 저장 액션 로직(목) + 빌드로 검증.

## 2. 설계 접근 — 재사용 편집기

- **레지스트리 `lib/adminLists.ts`**: 목록별 `{ key(라우트), table, title, columns[] }`. column은 `{ key(DB 컬럼), label, type: text|textarea|select, options? }`.
  - **서버 화이트리스트 역할**: 저장 액션은 이 레지스트리에 있는 key/table만 허용(클라이언트가 임의 테이블 못 건드림).
- **`ListEditor`(클라이언트)**: 초기 행 배열을 상태로 관리 — 행 추가/삭제/순서변경(↑↓)/값 수정. 저장 시 행 배열을 JSON으로 직렬화해 서버 액션에 제출(`useActionState`). 새 행의 id는 **클라이언트에서 생성**(재저장 시 중복 삽입 방지 — upsert가 같은 id를 갱신).
- **`saveList`(서버 액션)**: listKey 검증 → 로그인 확인 → 제출 행 파싱 → **정리**: 각 행 `sort_order = 배열 순서`로 upsert, 테이블에서 제출되지 않은 id는 삭제 → `revalidatePath('/', 'layout')`.
- **경로**: `/admin/lists/[list]` 동적 라우트. `/admin` 허브에서 각 목록으로 링크.

## 3. 저장 정리 로직 (reconcile)

1. listKey → 레지스트리 config(없으면 거부).
2. 로그인 사용자 확인(`@supabase/ssr` 서버 클라이언트, 미인증 → 로그인).
3. 제출 행(JSON) 파싱. 각 행: `{ id, ...columns }`. id는 클라이언트 제공(기존 행=DB id, 새 행=클라이언트 생성 id).
4. `desired` = 각 행에 `sort_order = index` 부여, config.columns 값만 포함(+id, +sort_order). **characters의 `photo_url`은 payload에 없어 upsert가 건드리지 않음 → 기존 사진 보존.**
5. `upsert(desired)` (PK=id 충돌 시 갱신).
6. 테이블 기존 id 조회 → `desired`에 없는 id 삭제.
7. `revalidatePath('/', 'layout')` → 공개 페이지 즉시 반영. `{ ok, message }` 반환.

- 쓰기·삭제는 로그인 세션 + RLS "auth write"만(모든 작업 허용). `service_role` 미사용.

## 4. UI

- `/admin/lists/[list]`: 서버에서 `select('*').order('sort_order')`로 해당 테이블의 원시 행 로드 → `ListEditor`에 전달(DB 컬럼명 그대로 사용).
- `ListEditor`: 섹션 제목 + 행 목록(각 행: column별 input/textarea/select + ↑↓ + 삭제) + "행 추가" + 저장 버튼 + 결과 메시지.
- 잘못된 list key → `notFound()`.
- `/admin` 허브: 단일 문구 편집(3B-1) + **목록 편집 링크 5종** + people(3B-3 예정 표시).

## 5. 테스트

- 레지스트리: 5개 목록 존재, table 매핑 정확, timeline `status`가 select+3옵션(완료/진행 중/예정).
- `ListEditor`: 초기 행/값 렌더, "행 추가"로 행 증가, 삭제로 감소, ↑↓ 동작(선택적), 저장 버튼.
- `saveList`: 알 수 없는 key 거부 / 로그인 시 upsert(sort_order=index) + 누락 id 삭제 + revalidate + 성공 반환(서버 클라이언트 목).
- 공개 페이지 회귀: 기존 테스트 유지.

## 6. 보안

- 저장/삭제 모두 로그인 필요(미들웨어 + 액션 내 getUser). 테이블은 레지스트리 화이트리스트로 제한.
- 값은 문자열로 저장. timeline status는 select로 유효값만(+ DB CHECK 제약).

## 7. 유의

- 새 행 id는 클라이언트 생성(`crypto.randomUUID` 있으면 사용, 없으면 대체) → 재저장 중복 방지.
- characters 저장 시 photo_url 미포함(3C 사진 보존).
- 커밋 메시지 한글 + 타입 접두사.

## 8. 진행 순서 요약

1. 레지스트리 `lib/adminLists.ts` + 테스트
2. `saveList` 서버 액션(정리 로직) + 테스트
3. `ListEditor` 클라이언트 편집기 + 테스트
4. `/admin/lists/[list]` 라우트 + `/admin` 허브 링크
5. 검증 + README
6. (후속) 3B-3 people(중첩), 3C 사진 업로드

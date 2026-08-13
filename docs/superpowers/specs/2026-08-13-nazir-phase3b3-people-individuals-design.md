# 〈나지르〉 Phase 3B-3 — 참여자 명단 개인화 + 편집 설계 문서

- 작성일: 2026-08-13
- 상태: 승인됨 (구현 계획 단계로 진행)
- 선행: Phase 3B-2(목록 편집) 완료 · `main` @ e3c0653
- 관련: 전체 설계 §4·§5, 3B-2 설계

## 1. 목적 · 범위

참여자 명단(people)을 **개인 단위**(역할·이름·약력·사진)로 재구성해 `/process`에
**개인 카드**로 보여주고, 관리자가 그룹·개인을 편집할 수 있게 한다. 구현은 두 단계:

- **3B-3a — 데이터 재구성 + 공개 카드 표시**: 스키마 변경·마이그레이션, 타입/데이터 계층, `/process` 카드 표시.
- **3B-3b — 관리자 편집(PeopleEditor)**: 그룹/개인 중첩 편집기 + 저장.

사진 업로드(photo_url 채우기)는 Phase 3C.

### 전제
- people는 현재 시드만 됐고 편집 이력이 없어, 개인 단위로 교체해도 안전.
- 등장인물(characters)은 이미 /about에 사진+설명 카드 구조 → 변경 없음(사진만 3C).

## 2. 데이터 재구성 (people_members)

### 현재 → 변경
- 현재: `people_members(id, group_id, text, sort_order)` — `text`는 "한 줄에 여러 명"(예: "연출 정은수 / 조연출 권도원").
- 변경: 개인 단위 컬럼 추가
  - `role text` (역할/직책, 예: 연출·기획팀·배우) — 선택(빈 값 허용)
  - `name text` (이름)
  - `bio text` (약력) — 선택(빈 값 허용, 기본 '')
  - `photo_url text null` (사진, 3C에서 채움)
  - `text` 컬럼 제거
- `people_groups`는 변경 없음(id·label·sort_order). 그룹은 완전 CRUD.

### 마이그레이션 (사용자가 대시보드에서 1회 실행)
- `supabase/migrations/0002_people_individuals.sql`: role/name/bio/photo_url 컬럼 추가 → 기존 people_members 행 삭제 → **현재 명단을 개인별로 분리한 행 삽입** → `text` 컬럼 제거.
- 분리 규칙: 줄 구분(" / ", " · ", ", ", 접두 "외 ")로 개인 분리, 각 개인은 역할+이름으로. 약력·사진은 빈 값.
- **1회성 마이그레이션**(재실행 시 people가 시드 상태로 초기화됨 — 문서에 명시).

### 타입 · 데이터 계층
- `PeopleMember`: `text` 제거, `role`·`name`·`bio`·`photoUrl` 추가.
- `content/data.ts`: 로컬(폴백) people를 동일한 개인 단위로 재작성(마이그레이션과 동일 데이터).
- `lib/content.ts`(Rows·assembleContent): members 매핑을 role/name/bio/photo_url로.
- 개수 테스트(data.test.ts): people_members 총 인원으로 갱신.

## 3. 공개 표시 (/process)

- "함께 세우는 사람들": 그룹별로 멤버를 **개인 카드**로 표시 — 사진 자리(1:1 placeholder) + 역할(작게) + 이름(크게) + 약력(있으면). 기존 아코디언은 유지하되 내용이 텍스트 → 카드 그리드로.
- 사진은 photo_url이 있으면 이미지, 없으면 placeholder(3C 전까지 전부 placeholder).

## 4. 관리자 편집 (3B-3b · /admin/lists/people)

- **PeopleEditor**(중첩 클라이언트 컴포넌트):
  - 그룹: 추가/삭제/순서변경(↑↓)/라벨 편집.
  - 각 그룹 안 멤버: 추가/삭제/순서변경 + 역할·이름·약력 편집(사진은 3C).
  - 새 그룹/멤버 id는 클라이언트 생성.
- **`savePeople`** 서버 액션: 로그인 확인 → 그룹 upsert(sort_order) → 멤버 upsert(group_id·sort_order) → 누락 멤버 삭제 → 누락 그룹 삭제(멤버 cascade) → `revalidatePath('/', 'layout')`.
- 허브(`/admin`)에 "참여자 명단" 링크 추가(3B-2 목록 링크 옆).

## 5. 보안 · 저장

- 저장/삭제는 로그인 세션 + RLS "auth write"만(`service_role` 미사용).
- people_members.group_id FK는 `on delete cascade`(그룹 삭제 시 멤버 자동 삭제).

## 6. 테스트

- 데이터: people 개인 수/구조(data.test.ts 갱신), assembleContent가 members를 role/name/bio로 조립.
- 공개 표시: /process가 개인 카드(역할·이름) 렌더.
- 편집(3B-3b): PeopleEditor 그룹/멤버 추가·삭제 상호작용, savePeople 로직(목: 그룹·멤버 upsert + 누락 삭제).
- 회귀: 기존 테스트 유지(people 참조 부분만 갱신).

## 7. 유의

- 마이그레이션은 people를 교체하므로 1회 실행(문서 경고). 사용자가 대시보드에서 적용.
- characters는 손대지 않음(이미 카드 구조, 사진은 3C).
- 커밋 메시지 한글 + 타입 접두사.

## 8. 진행 순서 요약

### 3B-3a (데이터 + 표시)
1. 마이그레이션 SQL(0002) — 컬럼 추가·개인 분리 시드·text 제거
2. 타입/`content/data.ts`/`lib/content.ts` 갱신(개인 단위) + 개수 테스트
3. `/process` 개인 카드 표시 + 테스트

### 3B-3b (편집)
4. `savePeople` 서버 액션 + 테스트
5. `PeopleEditor`(중첩) + 테스트
6. `/admin/lists/people` 라우트 + 허브 링크
7. 검증 + README

### 후속
- **Phase 3C** — 사진 업로드(characters·people_members의 photo_url).

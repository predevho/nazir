# 나지르 — 참여자 세부팀 + 개인 상세페이지 설계

작성일: 2026-08-14
상태: 확정 (구현 대기)

## 목표

참여자(`people_members`)를 **3단계 외형**(그룹 > 세부팀 > 개인)으로 보여주고,
각 개인을 **고유 URL `/people/[id]` 상세페이지**로 연결한다.
공개 카드(process)의 사진·이름을 클릭하면 그 사람의 상세페이지로 이동한다.

## 결정 사항 요약

| 항목 | 결정 |
|---|---|
| 데이터 모델 | **접근 A** — `people_members`에 `team`·`tagline` 컬럼 추가(중첩 그룹/새 테이블 없음) |
| 세부팀 적용 | 헤더진 + 팀원 (배우 등 team 빈값은 평면) |
| 상세페이지 대상 | 전원(헤더진·팀원·배우) |
| 상세페이지 형태 | 별도 라우트 `/people/[id]` (ISR, generateStaticParams) |
| 새 필드 | `tagline`(한 줄 소개)만. 세부 경력은 기존 `bio`(마크다운) 활용 |
| 카드 표시 | 현행 유지(사진·역할·이름·약력) + 사진·이름을 상세 링크로 |
| 팀원 기존 role | 마이그레이션에서 role→team 자동 이동(role은 비움) |

## 데이터 모델

### 마이그레이션 `supabase/migrations/0004_people_team_tagline.sql`

`people_members`에 컬럼 추가 + 팀원(g1) role→team 이동.

```sql
-- 참여자 세부팀·한줄소개 (people 3단계 + 개인 상세)
alter table people_members add column if not exists team text not null default '';
alter table people_members add column if not exists tagline text not null default '';

-- 팀원 그룹(g1)은 기존 role에 팀명이 들어있으므로 team으로 이동하고 role은 비운다.
-- (헤더진 g0의 role은 개별 직책이므로 건드리지 않는다. team은 관리자가 편집기에서 지정.)
update people_members set team = role, role = '' where group_id = 'g1' and team = '';
```

> 배포된 Supabase 대시보드 SQL Editor에서 **1회** 실행. `where ... and team = ''` 가드로 재실행 안전.
> 헤더진(g0)의 세부팀(연출팀·기획팀…)은 관리자가 편집기에서 각 멤버 `team`에 입력한다.

### 타입 (`content/types.ts`)

`PeopleMember`에 필드 추가:

```typescript
export interface PeopleMember {
  id: string;
  role: string;
  team: string;      // 세부팀(헤더진·팀원). 배우 등은 ''
  name: string;
  tagline: string;   // 한 줄 소개
  bio: string;
  photoUrl: string | null;
  sortOrder: number;
}
```

## 아키텍처

### 순수 헬퍼 (`lib/people.ts`)

**`groupMembersByTeam(members: PeopleMember[]): { team: string; members: PeopleMember[] }[]`**
- 멤버를 `team` 값으로 묶되, **첫 등장 순서**를 유지한다(멤버는 이미 sort_order로 정렬되어 들어옴).
- `team === ''` 인 멤버들은 team이 `''`인 버킷으로 묶인다(소제목 없이 렌더).
- 예: `[연출A(연출팀), 기획B(기획팀), 연출C(연출팀)]` → `[{team:'연출팀',[A,C]}, {team:'기획팀',[B]}]`.

**`findPersonById(content: AllContent, id: string): { member: PeopleMember; groupLabel: string } | null`**
- 모든 그룹의 members를 훑어 id 일치 멤버와 소속 그룹 label을 반환. 없으면 null.

두 함수 모두 순수 함수 → 단위 테스트 대상.

### 공개 렌더 (`app/(site)/process/page.tsx`)

각 그룹(Accordion) 내부를 `groupMembersByTeam`로 묶어 렌더:

```
Accordion(label=그룹명)
  └ team별 블록:
      - team !== '' 이면 소제목(team) 표시
      - 카드 그리드(현행 카드: 사진·역할·이름·약력)
```

카드의 **사진 + 이름(+역할)** 을 `<Link href={`/people/${m.id}`}>` 로 감싼다.
약력(MarkdownText, 링크 포함 가능)은 Link 밖에 둔다(중첩 앵커 방지).

### 상세 라우트 (`app/(site)/people/[id]/page.tsx`)

- 서버 컴포넌트. `getContent()` → `findPersonById(content, id)`. 없으면 `notFound()`.
- `generateStaticParams()`: 모든 그룹의 모든 member id 반환(ISR 사전생성).
- 레이아웃(기존 사이트 톤·컴포넌트 재사용):
  - 상단: `← 함께 세우는 사람들`(뒤로 링크 → `/process`).
  - 대형 사진(정사각/세로, 없으면 기존 placeholder 패턴).
  - 이름(대형) · 소속 표기(그룹 · team · role 중 값 있는 것만).
  - 한 줄 소개(tagline, 있으면).
  - 약력(bio) → `MarkdownText`로 크게. 빈 값이면 영역 생략.
- 페이지 `metadata`(선택): 이름 기반 title.

### 관리자 편집기

**로더 `app/admin/lists/people/page.tsx`**
- members select에 `team, tagline` 추가. `InitialGroup` member에 team·tagline 포함.

**`PeopleEditor.tsx`**
- `Member` 타입에 `team`·`tagline` 추가(초기화·addMember·payload 반영).
- 멤버 편집 UI에 입력 2개 추가: `team`(세부팀, 선택), `tagline`(한 줄 소개). 기존 role/name 행 근처에 배치.

**저장 액션 `app/admin/lists/people/actions.ts`**
- `InMember`에 team·tagline 추가. `desiredMembers` upsert에 `team`, `tagline` 포함.

### 콘텐츠 조립 (`lib/content.ts`)

- `Rows.members`에 `team, tagline` 추가.
- `people_members` select 문자열에 `team,tagline` 추가.
- `assembleContent`의 member 매핑에 `team: m.team, tagline: m.tagline` 추가.

### 로컬 폴백 시드 (`content/data.ts`)

- people 멤버 빌더에 `team: ''`, `tagline: ''` 기본값 추가(타입 충족). 팀원 시드는 기존 role값을 team으로 옮겨 로컬에서도 일관되게(선택, 최소한 타입만 충족하면 됨).

## 데이터 흐름

```
[관리자] PeopleEditor에서 team·tagline 입력 → savePeople upsert → people_members
[공개] getContent() → people(members에 team·tagline·bio)
  → process: groupMembersByTeam로 team 소제목 + 카드, 사진·이름은 /people/[id] 링크
  → /people/[id]: findPersonById로 멤버 찾아 상세 렌더
```

## 에러 처리 / 엣지

- `/people/[id]` id 없음 → `notFound()` (404).
- team 빈값 멤버 → 소제목 없이 카드만.
- tagline/bio 빈값 → 해당 영역 생략.
- 사진 없음 → 기존 placeholder.
- 신규 멤버 id는 클라이언트 발급 UUID(기존 규약) → 상세 URL과 저장 id 일치.

## 테스트

- `lib/people.test.ts`
  - `groupMembersByTeam`: 첫 등장 순서 유지, 같은 team 클러스터, 빈 team 버킷, 전부 빈 team.
  - `findPersonById`: 여러 그룹 중 일치 멤버·그룹 label 반환, 없으면 null.
- `lib/content.test.ts`: assemble 시 member에 team·tagline 매핑 확인(기존 테스트 확장).
- 상세 페이지: 최소 렌더 스모크(선택) — 존재 id는 이름 표시, 없는 id는 notFound 경로.
- 기존 전체 테스트 유지, `npm test`·`npm run build` 통과.

## 범위 밖 (YAGNI)

- SNS/인스타그램 링크 필드(이번 제외).
- `parent_id` 중첩 그룹(접근 B).
- 상세페이지 사진 라이트박스/갤러리.
- 방문자 대시보드(별도 기능으로 추후).

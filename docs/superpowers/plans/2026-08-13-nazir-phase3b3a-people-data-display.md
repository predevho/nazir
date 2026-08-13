# 〈나지르〉 Phase 3B-3a — 참여자 명단 개인화(데이터+표시) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** people_members를 개인 단위(역할·이름·약력·사진)로 재구성하고 `/process`에 개인 카드로 표시한다. 관리자 편집은 3B-3b.

**Architecture:** 스키마에 role/name/bio/photo_url 추가(text 제거) + 개인별 시드. 타입/로컬데이터/조립 계층을 개인 단위로 갱신. `/process`는 그룹 아코디언 안에 개인 카드 그리드.

**Tech Stack:** Next.js 16, Supabase(마이그레이션 SQL), TypeScript, Vitest.

**핵심 결정**
- 개인 분리 데이터(아래 "확정 인원 데이터")를 마이그레이션 SQL과 `content/data.ts`에 **동일하게** 사용.
- photo_url은 컬럼만 추가(빈 값, 3C에서 채움). bio도 빈 값(관리자가 3B-3b에서 입력).
- 커밋 메시지 한글 + 타입 접두사.
- **제약**: 마이그레이션 SQL은 이 세션에서 실행 안 함(사용자가 대시보드에서 1회 실행). 검증은 폴백 경로(로컬 데이터) 테스트 + 빌드 + 개수/구조 테스트.

**전제:** `main`(3B-2 완료), Supabase 연결됨(0001 + seed 적용됨). 작업은 새 브랜치.

---

## 확정 인원 데이터 (마이그레이션·data.ts 공통)

그룹 3개: `g0` 헤더진, `g1` 팀원, `g2` 배우. 멤버 id는 `g{gi}m{i}`.

**헤더진 (g0), 8명** — {역할, 이름}:
연출/정은수, 조연출/권도원, 디자인팀장/정은민, 미디어팀장/김수연, 홍보팀장/홍빛, 무대감독/이하은, 안무팀장/이하늘, 의소품팀장/김가은

**팀원 (g1), 18명** — {역할, 이름}:
기획팀/김은성, 기획팀/장시은, 디자인팀/구정서, 미디어팀/안새진, 미디어팀/권은수, 미디어팀/박지유, 홍보팀/임은혜, 무대팀/박명인, 의소품팀/오주형, 음향·음악팀/김시온, 음향·음악팀/강민규, 음향·음악팀/김태범, 음향·음악팀/배유미, 음향·음악팀/봉승빈, 음향·음악팀/봉종빈, 음향·음악팀/주찬영, 음향·음악팀/최요한, 음향·음악팀/이시온

**배우 (g2), 17명** — 역할 없음(빈 값), 이름만:
정주은, 신현택, 박주은, 김수, 박승주, 장지훈, 예수아, 예재빈, 오예현, 정영인, 진예빈, 추서연, 고은수, 양다인, 임현민, 정수지, 정인준

(bio·photo_url은 전부 빈 값/null)

---

## Task 1: 마이그레이션 SQL (0002)

**Files:** Create `supabase/migrations/0002_people_individuals.sql`. (실행은 사용자.)

- [ ] **Step 1: `supabase/migrations/0002_people_individuals.sql` 작성**

```sql
-- 참여자 명단을 개인 단위로 재구성 (Phase 3B-3a)
-- ⚠️ 1회만 실행하세요. 재실행 시 people_members가 아래 시드 상태로 초기화됩니다.
-- 대시보드 SQL Editor에 전체를 붙여넣어 실행.

alter table people_members add column if not exists role text not null default '';
alter table people_members add column if not exists name text not null default '';
alter table people_members add column if not exists bio text not null default '';
alter table people_members add column if not exists photo_url text;

-- 기존 행 제거 후, NOT NULL인 옛 text 컬럼을 먼저 제거해야 아래 insert(=text 미제공)가 통과한다.
delete from people_members;
alter table people_members drop column if exists text;

insert into people_members (id, group_id, role, name, bio, sort_order) values
  ('g0m0','g0','연출','정은수','',0),
  ('g0m1','g0','조연출','권도원','',1),
  ('g0m2','g0','디자인팀장','정은민','',2),
  ('g0m3','g0','미디어팀장','김수연','',3),
  ('g0m4','g0','홍보팀장','홍빛','',4),
  ('g0m5','g0','무대감독','이하은','',5),
  ('g0m6','g0','안무팀장','이하늘','',6),
  ('g0m7','g0','의소품팀장','김가은','',7),
  ('g1m0','g1','기획팀','김은성','',0),
  ('g1m1','g1','기획팀','장시은','',1),
  ('g1m2','g1','디자인팀','구정서','',2),
  ('g1m3','g1','미디어팀','안새진','',3),
  ('g1m4','g1','미디어팀','권은수','',4),
  ('g1m5','g1','미디어팀','박지유','',5),
  ('g1m6','g1','홍보팀','임은혜','',6),
  ('g1m7','g1','무대팀','박명인','',7),
  ('g1m8','g1','의소품팀','오주형','',8),
  ('g1m9','g1','음향·음악팀','김시온','',9),
  ('g1m10','g1','음향·음악팀','강민규','',10),
  ('g1m11','g1','음향·음악팀','김태범','',11),
  ('g1m12','g1','음향·음악팀','배유미','',12),
  ('g1m13','g1','음향·음악팀','봉승빈','',13),
  ('g1m14','g1','음향·음악팀','봉종빈','',14),
  ('g1m15','g1','음향·음악팀','주찬영','',15),
  ('g1m16','g1','음향·음악팀','최요한','',16),
  ('g1m17','g1','음향·음악팀','이시온','',17),
  ('g2m0','g2','','정주은','',0),
  ('g2m1','g2','','신현택','',1),
  ('g2m2','g2','','박주은','',2),
  ('g2m3','g2','','김수','',3),
  ('g2m4','g2','','박승주','',4),
  ('g2m5','g2','','장지훈','',5),
  ('g2m6','g2','','예수아','',6),
  ('g2m7','g2','','예재빈','',7),
  ('g2m8','g2','','오예현','',8),
  ('g2m9','g2','','정영인','',9),
  ('g2m10','g2','','진예빈','',10),
  ('g2m11','g2','','추서연','',11),
  ('g2m12','g2','','고은수','',12),
  ('g2m13','g2','','양다인','',13),
  ('g2m14','g2','','임현민','',14),
  ('g2m15','g2','','정수지','',15),
  ('g2m16','g2','','정인준','',16)
on conflict (id) do update set
  group_id = excluded.group_id, role = excluded.role, name = excluded.name,
  bio = excluded.bio, sort_order = excluded.sort_order;
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: 참여자 명단 개인화 마이그레이션 SQL(0002) 추가"
```

---

## Task 2: 타입 · 로컬 데이터 · 조립 계층

**Files:** Modify `content/types.ts`, `content/data.ts`, `lib/content.ts`, `content/data.test.ts`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: `content/types.ts` — PeopleMember 변경**

```ts
export interface PeopleMember {
  id: string;
  role: string;
  name: string;
  bio: string;
  photoUrl: string | null;
  sortOrder: number;
}
```
(기존 `text` 필드 제거. PeopleGroup은 그대로.)

- [ ] **Step 2: `content/data.ts` — people를 개인 단위로 재작성**

기존 `peopleSeeds`(줄 기반)와 `people` 매핑을 아래로 교체:
```ts
const peopleSeeds: { label: string; members: { role: string; name: string }[] }[] = [
  {
    label: '헤더진',
    members: [
      { role: '연출', name: '정은수' },
      { role: '조연출', name: '권도원' },
      { role: '디자인팀장', name: '정은민' },
      { role: '미디어팀장', name: '김수연' },
      { role: '홍보팀장', name: '홍빛' },
      { role: '무대감독', name: '이하은' },
      { role: '안무팀장', name: '이하늘' },
      { role: '의소품팀장', name: '김가은' },
    ],
  },
  {
    label: '팀원',
    members: [
      { role: '기획팀', name: '김은성' },
      { role: '기획팀', name: '장시은' },
      { role: '디자인팀', name: '구정서' },
      { role: '미디어팀', name: '안새진' },
      { role: '미디어팀', name: '권은수' },
      { role: '미디어팀', name: '박지유' },
      { role: '홍보팀', name: '임은혜' },
      { role: '무대팀', name: '박명인' },
      { role: '의소품팀', name: '오주형' },
      { role: '음향·음악팀', name: '김시온' },
      { role: '음향·음악팀', name: '강민규' },
      { role: '음향·음악팀', name: '김태범' },
      { role: '음향·음악팀', name: '배유미' },
      { role: '음향·음악팀', name: '봉승빈' },
      { role: '음향·음악팀', name: '봉종빈' },
      { role: '음향·음악팀', name: '주찬영' },
      { role: '음향·음악팀', name: '최요한' },
      { role: '음향·음악팀', name: '이시온' },
    ],
  },
  {
    label: '배우',
    members: [
      { role: '', name: '정주은' },
      { role: '', name: '신현택' },
      { role: '', name: '박주은' },
      { role: '', name: '김수' },
      { role: '', name: '박승주' },
      { role: '', name: '장지훈' },
      { role: '', name: '예수아' },
      { role: '', name: '예재빈' },
      { role: '', name: '오예현' },
      { role: '', name: '정영인' },
      { role: '', name: '진예빈' },
      { role: '', name: '추서연' },
      { role: '', name: '고은수' },
      { role: '', name: '양다인' },
      { role: '', name: '임현민' },
      { role: '', name: '정수지' },
      { role: '', name: '정인준' },
    ],
  },
];
const people: PeopleGroup[] = peopleSeeds.map((g, gi) => ({
  id: `g${gi}`,
  label: g.label,
  sortOrder: gi,
  members: g.members.map((m, i) => ({
    id: `g${gi}m${i}`,
    role: m.role,
    name: m.name,
    bio: '',
    photoUrl: null,
    sortOrder: i,
  })),
}));
```

- [ ] **Step 3: `lib/content.ts` — Rows·assembleContent members 매핑 갱신**

`Rows`의 members 타입을:
```ts
members: { id: string; group_id: string; role: string; name: string; bio: string; photo_url: string | null; sort_order: number }[];
```
`assembleContent`의 people members 매핑을:
```ts
members: rows.members.filter((m) => m.group_id === g.id).sort(byOrder).map((m) => ({
  id: m.id, role: m.role, name: m.name, bio: m.bio, photoUrl: m.photo_url, sortOrder: m.sort_order,
})),
```
`getContent`의 people_members select를:
```ts
client.from('people_members').select('id,group_id,role,name,bio,photo_url,sort_order'),
```

- [ ] **Step 4: `content/data.test.ts` 갱신**

people 개수 검증을 개인 단위로:
```ts
it('has 3 people groups with individuals', () => {
  expect(content.people).toHaveLength(3);
  const total = content.people.reduce((n, g) => n + g.members.length, 0);
  expect(total).toBe(43);
  expect(content.people[0].members[0]).toMatchObject({ role: '연출', name: '정은수' });
});
```
(기존 people 관련 단언이 `text`를 참조하면 위로 교체.)

`lib/content.test.ts`의 assembleContent 테스트에서 members가 `text`를 쓰면 role/name으로 갱신(예: `{ id:'g0m0', group_id:'g0', role:'연출', name:'정은수', bio:'', photo_url:null, sort_order:0 }` 형태로 입력, 결과 `.people[0].members[0].name === '정은수'` 확인).

- [ ] **Step 5: 테스트 + 빌드**

Run: `npm test` → 통과(개수 43, 구조). Run: `npm run build` → 성공. 실패 시 `rm -rf .next` 후 재빌드.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: 참여자 명단을 개인 단위(역할·이름·약력·사진) 데이터로 재구성"
```

---

## Task 3: /process 개인 카드 표시

**Files:** Modify `app/(site)/process/page.tsx`, `app/(site)/process/page.test.tsx`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: Process 페이지의 people 아코디언 내용을 개인 카드 그리드로 교체**

기존:
```tsx
<Accordion key={g.id} label={g.label} defaultOpen={g.label === '헤더진'}>
  {g.members.map((m) => (
    <p key={m.id} className="m-0 text-[13.5px] font-light leading-[1.95] text-paper/[0.78]">{m.text}</p>
  ))}
</Accordion>
```
아래로 교체:
```tsx
<Accordion key={g.id} label={g.label} defaultOpen={g.label === '헤더진'}>
  <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
    {g.members.map((m) => (
      <div key={m.id} className="flex flex-col gap-1.5">
        <div className="aspect-square rounded-sm overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
          {m.photoUrl ? (
            <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-[10px] text-paper/40">사진</span>
          )}
        </div>
        {m.role && <span className="font-mono text-[10px] tracking-[0.06em] text-gold">{m.role}</span>}
        <span className="font-display text-sm text-paper leading-tight">{m.name}</span>
        {m.bio && <span className="text-[12px] font-light text-paper/60 leading-relaxed">{m.bio}</span>}
      </div>
    ))}
  </div>
</Accordion>
```
(다른 부분은 변경 없음. `m.text` 참조가 남아 있지 않은지 확인.)

- [ ] **Step 2: `app/(site)/process/page.test.tsx` 갱신**

people 관련 단언을 개인 이름으로:
```tsx
it('shows the production timeline with a status chip', async () => {
  render(await Process());
  expect(screen.getByText('대본 작업')).toBeInTheDocument();
  expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
});
it('shows people as individuals and budget total', async () => {
  render(await Process());
  expect(screen.getByText('₩ 9,000,000')).toBeInTheDocument();
  // 헤더진(기본 펼침)의 개인 이름
  expect(screen.getByText('정은수')).toBeInTheDocument();
  expect(screen.getByText('연출')).toBeInTheDocument();
});
```
(기존 `/연출 정은수/`, `/기획팀 김은성/` 같은 줄 기반 단언은 위로 교체. 팀원 그룹 펼침 테스트가 필요하면 userEvent로 '팀원' 클릭 후 '김은성' 확인.)

- [ ] **Step 3: 테스트 + 빌드 + 육안(선택)**

Run: `npm test` → 통과. Run: `npm run build` → 성공.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 무대에 오르기까지 페이지의 참여자를 개인 카드로 표시"
```

---

## Task 4: 검증 · README

**Files:** Modify `README.md`. 검증만.

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과. Run: `npm run build` → 성공.

- [ ] **Step 2: README 갱신**

- Supabase 연결 절에 마이그레이션 `0002` 안내 추가(이미 0001+seed를 적용한 사용자는 `supabase/migrations/0002_people_individuals.sql`을 대시보드에서 **1회** 실행 → 참여자 명단이 개인 단위로 전환).
- 로드맵: Phase 3B-3a(완료 — 참여자 개인화 데이터·표시), 3B-3b(참여자 편집)·3C(사진) 예정.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: 참여자 명단 개인화 마이그레이션(0002) 안내 추가"
```

---

## 후속 (별도 계획)

- **Phase 3B-3b** — 참여자 편집: `PeopleEditor`(그룹/개인 중첩 CRUD) + `savePeople` + `/admin/lists/people` + 허브 링크.
- **Phase 3C** — 사진 업로드(characters·people_members의 photo_url).

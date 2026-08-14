# 참여자 세부팀 + 개인 상세페이지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 참여자를 그룹>세부팀>개인 3단계로 보여주고, 각 개인을 `/people/[id]` 상세페이지로 연결한다.

**Architecture:** `people_members`에 `team`·`tagline` 컬럼을 추가하고(중첩 그룹 없음), 순수 헬퍼 `groupMembersByTeam`/`findPersonById`로 렌더링을 구성한다. process 카드의 사진·이름을 상세 링크로 감싸고, `/people/[id]`는 `getContent()`에서 id로 멤버를 찾아 렌더한다.

**Tech Stack:** Next.js 16(App Router), React 19, TypeScript, Tailwind v3, Supabase, Vitest.

---

## 파일 구조

- Create: `supabase/migrations/0004_people_team_tagline.sql` — team·tagline 컬럼 + 팀원 role→team 이동
- Modify: `content/types.ts` — `PeopleMember`에 team·tagline
- Modify: `lib/content.ts` — Rows·select·assemble에 team·tagline
- Modify: `content/data.ts` — 로컬 시드 team·tagline(팀원은 role→team)
- Modify: `lib/content.test.ts` — assemble 테스트에 team·tagline
- Create: `lib/people.ts` — `groupMembersByTeam`, `findPersonById`
- Create: `lib/people.test.ts` — 두 헬퍼 단위 테스트
- Modify: `app/(site)/process/page.tsx` — 세부팀 소제목 + 카드 상세 링크
- Create: `app/(site)/people/[id]/page.tsx` — 개인 상세페이지
- Modify: `app/admin/lists/people/page.tsx` — 로더 team·tagline
- Modify: `app/admin/lists/people/PeopleEditor.tsx` — team·tagline 입력
- Modify: `app/admin/lists/people/actions.ts` — savePeople team·tagline
- Modify: `README.md` — 기능·0004 안내

---

## Task 1: 마이그레이션 0004 (team·tagline 컬럼 + 팀원 role→team)

**Files:**
- Create: `supabase/migrations/0004_people_team_tagline.sql`

- [ ] **Step 1: 마이그레이션 작성**

`supabase/migrations/0004_people_team_tagline.sql`:

```sql
-- 참여자 세부팀·한줄소개 (people 3단계 외형 + 개인 상세)
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. where 가드로 재실행 안전.
alter table people_members add column if not exists team text not null default '';
alter table people_members add column if not exists tagline text not null default '';

-- 팀원 그룹(g1)은 기존 role에 팀명(기획팀·미디어팀…)이 있으므로 team으로 옮기고 role은 비운다.
-- 헤더진(g0)의 role은 개별 직책이라 건드리지 않는다. g0의 team은 관리자가 편집기에서 지정.
update people_members set team = role, role = '' where group_id = 'g1' and team = '';
```

- [ ] **Step 2: 커밋**

```bash
git add supabase/migrations/0004_people_team_tagline.sql
git commit -m "feat: people_members team·tagline 컬럼 마이그레이션(0004)"
```

> 참고: 배포 Supabase에 수동 적용 필요. 구현 중 실제 DB에 적용하지 말 것.

---

## Task 2: 타입·콘텐츠 조립·로컬 시드에 team·tagline 반영

**Files:**
- Modify: `content/types.ts`
- Modify: `lib/content.ts`
- Modify: `content/data.ts`
- Modify: `lib/content.test.ts`

이 태스크는 `PeopleMember`에 필수 필드를 더하므로, 모든 생성 지점(content 조립·로컬 시드·테스트)을 함께 고쳐 tsc/테스트를 green으로 유지한다.

- [ ] **Step 1: 테스트 데이터·단언 갱신 (실패 유도)**

`lib/content.test.ts`의 members 배열(현재 team·tagline 없음)을 교체:

```typescript
      members: [
        { id: 'g0m0', group_id: 'g0', role: '연출', team: '연출팀', name: '정은수', tagline: '', bio: '', photo_url: null, sort_order: 0 },
        { id: 'g1m0', group_id: 'g1', role: '', team: '기획팀', name: '김은성', tagline: '한 줄', bio: '', photo_url: null, sort_order: 0 },
      ],
```

그리고 `expect(result.people[0].members[0].name).toBe('정은수');` 다음 줄에 단언 추가:

```typescript
    expect(result.people[0].members[0].team).toBe('연출팀');
    expect(result.people[1].members[0].tagline).toBe('한 줄');
```

- [ ] **Step 2: 테스트 실행 → 타입/실패 확인**

Run: `npx vitest run lib/content.test.ts`
Expected: 컴파일 에러 또는 실패(아직 Rows에 team/tagline 없음, assemble이 매핑 안 함).

- [ ] **Step 3: `content/types.ts` PeopleMember에 필드 추가**

`PeopleMember` 인터페이스를 다음으로 교체:

```typescript
export interface PeopleMember {
  id: string;
  role: string;
  team: string;
  name: string;
  tagline: string;
  bio: string;
  photoUrl: string | null;
  sortOrder: number;
}
```

- [ ] **Step 4: `lib/content.ts` Rows·select·assemble 수정**

`Rows` 타입의 members를 교체:

```typescript
  members: { id: string; group_id: string; role: string; team: string; name: string; tagline: string; bio: string; photo_url: string | null; sort_order: number }[];
```

people_members select 문자열 교체:

```typescript
      client.from('people_members').select('id,group_id,role,team,name,tagline,bio,photo_url,sort_order'),
```

assemble의 member 매핑을 교체(members.filter(...).sort(...).map 내부):

```typescript
        id: m.id, role: m.role, team: m.team, name: m.name, tagline: m.tagline, bio: m.bio, photoUrl: m.photo_url, sortOrder: m.sort_order,
```

- [ ] **Step 5: `content/data.ts` 로컬 시드 빌더 수정**

people 빌더(`const people: PeopleGroup[] = peopleSeeds.map(...)`)의 members 매핑을 교체(팀원 그룹 gi===1은 role→team):

```typescript
  members: g.members.map((m, i) => {
    const isTeamGroup = gi === 1; // 팀원
    return {
      id: `g${gi}m${i}`,
      role: isTeamGroup ? '' : m.role,
      team: isTeamGroup ? m.role : '',
      name: m.name,
      tagline: '',
      bio: '',
      photoUrl: null,
      sortOrder: i,
    };
  }),
```

- [ ] **Step 6: 테스트·타입체크 통과 확인**

Run: `npx vitest run lib/content.test.ts && npx tsc --noEmit`
Expected: PASS, 타입 에러 없음.

- [ ] **Step 7: 커밋**

```bash
git add content/types.ts lib/content.ts content/data.ts lib/content.test.ts
git commit -m "feat: 참여자 데이터에 team·tagline 필드 추가(타입·조립·시드)"
```

---

## Task 3: 순수 헬퍼 `lib/people.ts` (TDD)

**Files:**
- Create: `lib/people.ts`
- Test: `lib/people.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/people.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { groupMembersByTeam, findPersonById } from './people';
import type { AllContent, PeopleMember } from '../content/types';

function m(id: string, team: string, name = id): PeopleMember {
  return { id, role: '', team, name, tagline: '', bio: '', photoUrl: null, sortOrder: 0 };
}

describe('groupMembersByTeam', () => {
  it('team별로 묶되 첫 등장 순서를 유지한다', () => {
    const r = groupMembersByTeam([m('a', '연출팀'), m('b', '기획팀'), m('c', '연출팀')]);
    expect(r).toEqual([
      { team: '연출팀', members: [m('a', '연출팀'), m('c', '연출팀')] },
      { team: '기획팀', members: [m('b', '기획팀')] },
    ]);
  });
  it('team이 빈 멤버는 빈 team 버킷으로 묶인다', () => {
    const r = groupMembersByTeam([m('a', ''), m('b', '')]);
    expect(r).toEqual([{ team: '', members: [m('a', ''), m('b', '')] }]);
  });
  it('빈 배열은 빈 결과', () => {
    expect(groupMembersByTeam([])).toEqual([]);
  });
});

describe('findPersonById', () => {
  const content = {
    people: [
      { id: 'g0', label: '헤더진', sortOrder: 0, members: [m('g0m0', '연출팀', '정은수')] },
      { id: 'g1', label: '팀원', sortOrder: 1, members: [m('g1m0', '기획팀', '김은성')] },
    ],
  } as unknown as AllContent;
  it('여러 그룹에서 id로 멤버와 그룹 label을 찾는다', () => {
    expect(findPersonById(content, 'g1m0')).toEqual({ member: m('g1m0', '기획팀', '김은성'), groupLabel: '팀원' });
  });
  it('없으면 null', () => {
    expect(findPersonById(content, 'zzz')).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/people.test.ts`
Expected: FAIL — 모듈/함수 미정의.

- [ ] **Step 3: 구현**

`lib/people.ts`:

```typescript
import type { AllContent, PeopleMember } from '../content/types';

export type TeamBucket = { team: string; members: PeopleMember[] };

/** 멤버를 team 값으로 묶되 첫 등장 순서를 유지한다. team ''는 하나의 빈 버킷으로. */
export function groupMembersByTeam(members: PeopleMember[]): TeamBucket[] {
  const buckets: TeamBucket[] = [];
  const index = new Map<string, TeamBucket>();
  for (const member of members) {
    let bucket = index.get(member.team);
    if (!bucket) {
      bucket = { team: member.team, members: [] };
      index.set(member.team, bucket);
      buckets.push(bucket);
    }
    bucket.members.push(member);
  }
  return buckets;
}

/** 모든 그룹을 훑어 id 일치 멤버와 소속 그룹 label을 반환. 없으면 null. */
export function findPersonById(content: AllContent, id: string): { member: PeopleMember; groupLabel: string } | null {
  for (const group of content.people) {
    const member = group.members.find((mm) => mm.id === id);
    if (member) return { member, groupLabel: group.label };
  }
  return null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/people.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/people.ts lib/people.test.ts
git commit -m "feat: 참여자 헬퍼 groupMembersByTeam·findPersonById 추가"
```

---

## Task 4: 공개 process 페이지 — 세부팀 소제목 + 카드 상세 링크

**Files:**
- Modify: `app/(site)/process/page.tsx`

- [ ] **Step 1: import 추가**

`app/(site)/process/page.tsx` 상단 import 목록에 추가(파일 최상단의 다른 import 근처):

```tsx
import Link from 'next/link';
import { groupMembersByTeam } from '@/lib/people';
```

- [ ] **Step 2: 그룹 내부 렌더를 세부팀 묶음 + 링크 카드로 교체**

기존 Accordion 내부 블록(현재):

```tsx
          <Accordion key={g.id} label={g.label} defaultOpen={g.label === '헤더진'}>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              {g.members.map((m) => (
                <div key={m.id} className="flex flex-col gap-1.5">
                  <div className="aspect-square rounded-sm overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
                    {m.photoUrl ? (
                      <img src={m.photoUrl} alt={m.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-mono text-[10px] text-paper/40">사진</span>
                    )}
                  </div>
                  {m.role && <span className="font-mono text-[10px] tracking-[0.06em] text-gold">{m.role}</span>}
                  <span className="font-display text-sm text-paper leading-tight">{m.name}</span>
                  <MarkdownText className="text-[12px] font-light text-paper/70">{m.bio}</MarkdownText>
                </div>
              ))}
            </div>
          </Accordion>
```

을 다음으로 교체:

```tsx
          <Accordion key={g.id} label={g.label} defaultOpen={g.label === '헤더진'}>
            <div className="flex flex-col gap-4">
              {groupMembersByTeam(g.members).map((bucket) => (
                <div key={bucket.team || '_'} className="flex flex-col gap-2">
                  {bucket.team && (
                    <span className="font-mono text-[11px] tracking-[0.14em] text-gold/80 border-l-2 border-gold/40 pl-2">{bucket.team}</span>
                  )}
                  <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
                    {bucket.members.map((m) => (
                      <div key={m.id} className="flex flex-col gap-1.5">
                        <Link href={`/people/${m.id}`} className="flex flex-col gap-1.5 group">
                          <div className="aspect-square rounded-sm overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
                            {m.photoUrl ? (
                              <img src={m.photoUrl} alt={m.name} loading="lazy" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                            ) : (
                              <span className="font-mono text-[10px] text-paper/40">사진</span>
                            )}
                          </div>
                          {m.role && <span className="font-mono text-[10px] tracking-[0.06em] text-gold">{m.role}</span>}
                          <span className="font-display text-sm text-paper leading-tight group-hover:text-gold transition-colors">{m.name}</span>
                        </Link>
                        <MarkdownText className="text-[12px] font-light text-paper/70">{m.bio}</MarkdownText>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Accordion>
```

- [ ] **Step 3: 타입체크·빌드 확인**

Run: `npx tsc --noEmit && npm run build`
Expected: 타입 에러 없음, 빌드 성공.

- [ ] **Step 4: 커밋**

```bash
git add "app/(site)/process/page.tsx"
git commit -m "feat: process 참여자에 세부팀 소제목·개인 상세 링크 적용"
```

---

## Task 5: 개인 상세 라우트 `/people/[id]`

**Files:**
- Create: `app/(site)/people/[id]/page.tsx`

- [ ] **Step 1: 상세페이지 작성**

`app/(site)/people/[id]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { findPersonById } from '@/lib/people';
import { MarkdownText } from '@/components/MarkdownText';

export async function generateStaticParams() {
  const { people } = await getContent();
  return people.flatMap((g) => g.members.map((m) => ({ id: m.id })));
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getContent();
  const found = findPersonById(content, id);
  if (!found) notFound();
  const { member, groupLabel } = found;
  const meta = [groupLabel, member.team, member.role].filter(Boolean).join(' · ');

  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(32px,7vw,64px)]">
      <Link href="/process" className="font-mono text-[11px] text-gold hover:text-gold-soft">← 함께 세우는 사람들</Link>
      <div className="mt-6 grid gap-6 sm:[grid-template-columns:280px_1fr] items-start">
        <div className="aspect-square rounded-sm overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-[11px] text-paper/40">사진</span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {meta && <span className="font-mono text-[11px] tracking-[0.12em] text-gold">{meta}</span>}
          <h1 className="font-display font-bold text-[clamp(28px,6vw,44px)] text-paper leading-tight m-0">{member.name}</h1>
          {member.tagline && <p className="font-display text-[15px] text-paper/70 leading-relaxed">{member.tagline}</p>}
          {member.bio && (
            <div className="mt-2 pt-4 border-t border-gold/15">
              <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">약력</span>
              <MarkdownText className="mt-2 text-[14px] font-light leading-[1.9] text-paper/[0.82]">{member.bio}</MarkdownText>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 타입체크·빌드 확인**

Run: `npx tsc --noEmit && npm run build`
Expected: 타입 에러 없음, 빌드 성공(`/people/[id]` 정적 생성 확인).

- [ ] **Step 3: 커밋**

```bash
git add "app/(site)/people/[id]/page.tsx"
git commit -m "feat: 개인 상세페이지 /people/[id] 추가"
```

---

## Task 6: 관리자 편집기 team·tagline 연결

**Files:**
- Modify: `app/admin/lists/people/page.tsx`
- Modify: `app/admin/lists/people/PeopleEditor.tsx`
- Modify: `app/admin/lists/people/actions.ts`

- [ ] **Step 1: 로더가 team·tagline을 읽어 전달**

`app/admin/lists/people/page.tsx`의 members select 교체:

```tsx
    supabase.from('people_members').select('id,group_id,role,team,name,tagline,bio,photo_url,sort_order').order('sort_order'),
```

`initialGroups` 매핑의 member 객체 교체:

```tsx
      .map((m) => ({ id: m.id, role: m.role ?? '', team: m.team ?? '', name: m.name ?? '', tagline: m.tagline ?? '', bio: m.bio ?? '', photo_url: m.photo_url ?? null })),
```

- [ ] **Step 2: PeopleEditor 타입·상태에 team·tagline 추가**

`app/admin/lists/people/PeopleEditor.tsx`의 타입 교체:

```tsx
type Member = { _key: string; id: string; role: string; team: string; name: string; tagline: string; bio: BioLine[]; photoUrl: string };
```

`InitialGroup` 타입 교체:

```tsx
export type InitialGroup = { id: string; label: string; members: { id: string; role: string; team: string; name: string; tagline: string; bio: string; photo_url: string | null }[] };
```

초기화 매핑 교체(기존 `members: g.members.map((m) => ({ ... photoUrl ... }))`):

```tsx
      members: g.members.map((m) => ({ _key: makeId(), id: m.id, role: m.role, team: m.team, name: m.name, tagline: m.tagline, bio: parseBio(m.bio), photoUrl: m.photo_url ?? '' })),
```

`addMember`의 새 멤버 객체 교체:

```tsx
    setG((gs) => gs.map((g) => (g._key === gk ? { ...g, members: [...g.members, { _key: id, id, role: '', team: '', name: '', tagline: '', bio: [], photoUrl: '' }] } : g)));
```

`setPhoto` 함수 근처에 team·tagline 갱신 헬퍼 추가:

```tsx
  function setTeam(gk: string, mk: string, value: string) {
    updateMember(gk, mk, (m) => ({ ...m, team: value }));
  }
  function setTagline(gk: string, mk: string, value: string) {
    updateMember(gk, mk, (m) => ({ ...m, tagline: value }));
  }
```

payload members 매핑 교체:

```tsx
    members: g.members.map((m) => ({ id: m.id, role: m.role, team: m.team, name: m.name, tagline: m.tagline, bio: serializeBio(m.bio), photoUrl: m.photoUrl })),
```

- [ ] **Step 3: PeopleEditor에 team·tagline 입력 UI 추가**

멤버 블록에서 role/name 입력 `<div className="flex gap-2 items-center">…</div>` 바로 다음 줄(PhotoField 앞)에 삽입:

```tsx
                <div className="flex gap-2 items-center">
                  <input value={m.team} onChange={(e) => setTeam(g._key, m._key, e.target.value)} placeholder="세부팀(선택, 예: 연출팀)" aria-label="세부팀" className={`w-[34%] ${inputCls}`} />
                  <input value={m.tagline} onChange={(e) => setTagline(g._key, m._key, e.target.value)} placeholder="한 줄 소개(선택)" aria-label="한 줄 소개" className={`flex-1 ${inputCls}`} />
                </div>
```

- [ ] **Step 4: savePeople에 team·tagline 반영**

`app/admin/lists/people/actions.ts`의 `InMember` 타입 교체:

```typescript
type InMember = { id?: string; role?: string; team?: string; name?: string; tagline?: string; bio?: string; photoUrl?: string };
```

`desiredMembers` 배열 타입 교체:

```typescript
  const desiredMembers: { id: string; group_id: string; role: string; team: string; name: string; tagline: string; bio: string; photo_url: string | null; sort_order: number }[] = [];
```

`desiredMembers.push({...})`에 team·tagline 추가(기존 role 라인 뒤, name 라인 사이 등 객체 내부):

```typescript
        role: String(m.role ?? ''),
        team: String(m.team ?? ''),
        name: String(m.name ?? ''),
        tagline: String(m.tagline ?? ''),
```

- [ ] **Step 5: 전체 테스트·타입체크·빌드**

Run: `npx vitest run && npx tsc --noEmit && npm run build`
Expected: 전부 PASS, 타입 에러 없음, 빌드 성공.

- [ ] **Step 6: 커밋**

```bash
git add app/admin/lists/people/page.tsx app/admin/lists/people/PeopleEditor.tsx app/admin/lists/people/actions.ts
git commit -m "feat: 참여자 편집기에 세부팀·한줄소개 입력 연결"
```

---

## Task 7: README 갱신

**Files:**
- Modify: `README.md`

- [ ] **Step 1: README에 기능·마이그레이션 반영**

`README.md`에 다음을 반영(기존 문서 스타일에 맞춰):
- 참여자 명단 편집 설명에 "세부팀·한 줄 소개" 입력과 개인 상세페이지(`/people/[id]`) 추가.
- 마이그레이션 목록에 `0004_people_team_tagline.sql`(배포 Supabase 수동 적용 필요, 팀원 role→team 이동 포함) 추가.
- 로드맵에 "참여자 세부팀 + 개인 상세페이지 (완료)" 한 줄 추가.

- [ ] **Step 2: 커밋**

```bash
git add README.md
git commit -m "docs: 참여자 세부팀·개인 상세페이지 반영 및 0004 안내"
```

---

## 최종 검증

- [ ] `npx vitest run` — 기존 49개 + 신규(people 5) 전부 PASS
- [ ] `npx tsc --noEmit` — 타입 에러 없음
- [ ] `npm run build` — 빌드 성공(`/people/[id]` 생성)
- [ ] (선택) 프로덕션 서버(3100)로 QA: process에서 세부팀 소제목 표시, 카드 클릭 → `/people/[id]` 이동
- [ ] 배포 Supabase에 `0004_people_team_tagline.sql` 수동 적용 안내

> 개발 서버(next dev)는 서브에이전트가 띄우지 말 것. 확인은 `rm -rf .next && npm run build && npx next start -p 3100`.

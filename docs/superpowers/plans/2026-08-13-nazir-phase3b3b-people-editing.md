# 〈나지르〉 Phase 3B-3b — 참여자 명단 편집(PeopleEditor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 관리자가 참여자 명단을 그룹·개인 중첩으로 편집(그룹/개인 추가·삭제·순서변경, 역할·이름·약력 수정)하고 저장하면 즉시 반영한다.

**Architecture:** 중첩 클라이언트 편집기 `PeopleEditor`가 그룹·멤버 상태를 관리해 JSON 제출. 서버 액션 `savePeople`이 두 테이블(people_groups·people_members)을 정리(upsert + 누락 삭제, 그룹 삭제 시 cascade) 후 `revalidatePath`. 사진(photo_url)은 편집 대상 아님(3C, upsert에 미포함해 보존).

**Tech Stack:** Next.js 16, `@supabase/ssr`, React 19(useActionState), TypeScript, Vitest.

**핵심 결정**
- people 전용 라우트 `/admin/lists/people`(정적 세그먼트 → 기존 `[list]` 동적 라우트보다 우선).
- 새 그룹/멤버 id는 클라이언트 생성. 멤버 upsert에 photo_url 미포함(사진 보존).
- 커밋 메시지 한글 + 타입 접두사.
- **제약**: 실제 저장 왕복은 로그인 후 확인. 여기서는 편집기 렌더/상호작용 + savePeople 로직(목) + 빌드로 검증.

**전제:** `main`(3B-3a 완료), Supabase에 개인화된 people(0002 적용됨). 작업은 새 브랜치.

---

## File Structure

| 경로 | 상태 | 책임 |
|------|------|------|
| `app/admin/lists/people/actions.ts` | 신규 | `savePeople` 서버 액션(그룹·멤버 정리) |
| `app/admin/lists/people/actions.test.ts` | 신규 | 저장 로직(목) |
| `app/admin/lists/people/PeopleEditor.tsx` | 신규 | 중첩 편집기(클라이언트) |
| `app/admin/lists/people/PeopleEditor.test.tsx` | 신규 | 편집기 렌더·추가/삭제 |
| `app/admin/lists/people/page.tsx` | 신규 | 편집 화면(서버, 현재 명단 로드) |
| `app/admin/page.tsx` | 수정 | 허브에 "참여자 명단" 링크 |

---

## Task 1: savePeople 서버 액션

**Files:** Create `app/admin/lists/people/actions.ts`, `app/admin/lists/people/actions.test.ts`. 검증: `npm test`

- [ ] **Step 1: `app/admin/lists/people/actions.ts`**

```ts
'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type SaveState = { ok: boolean; message: string };

type InMember = { id?: string; role?: string; name?: string; bio?: string };
type InGroup = { id?: string; label?: string; members?: InMember[] };

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'srv-' + Math.random().toString(36).slice(2);
}

export async function savePeople(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  let groups: InGroup[];
  try {
    const raw = JSON.parse(String(formData.get('groups') ?? '[]'));
    if (!Array.isArray(raw)) throw new Error('not array');
    groups = raw;
  } catch {
    return { ok: false, message: '데이터 형식 오류입니다.' };
  }

  const desiredGroups = groups.map((g, gi) => ({
    id: g.id && String(g.id).trim() ? String(g.id) : makeId(),
    label: String(g.label ?? ''),
    sort_order: gi,
  }));
  const desiredMembers: { id: string; group_id: string; role: string; name: string; bio: string; sort_order: number }[] = [];
  groups.forEach((g, gi) => {
    const groupId = desiredGroups[gi].id;
    (g.members ?? []).forEach((m, mi) => {
      desiredMembers.push({
        id: m.id && String(m.id).trim() ? String(m.id) : makeId(),
        group_id: groupId,
        role: String(m.role ?? ''),
        name: String(m.name ?? ''),
        bio: String(m.bio ?? ''),
        sort_order: mi,
      });
    });
  });

  // 그룹 먼저 upsert(멤버 FK), 그다음 멤버 (빈 배열이면 upsert 생략 — 삭제는 아래에서 수행)
  if (desiredGroups.length) {
    const gUp = await supabase.from('people_groups').upsert(desiredGroups);
    if (gUp.error) return { ok: false, message: `그룹 저장 실패: ${gUp.error.message}` };
  }
  if (desiredMembers.length) {
    const mUp = await supabase.from('people_members').upsert(desiredMembers);
    if (mUp.error) return { ok: false, message: `멤버 저장 실패: ${mUp.error.message}` };
  }

  // 누락 멤버 삭제
  const keepM = new Set(desiredMembers.map((m) => m.id));
  const existM = await supabase.from('people_members').select('id');
  if (existM.error) return { ok: false, message: `조회 실패: ${existM.error.message}` };
  const delM = (existM.data ?? []).map((r) => r.id as string).filter((id) => !keepM.has(id));
  if (delM.length) {
    const d = await supabase.from('people_members').delete().in('id', delM);
    if (d.error) return { ok: false, message: `멤버 삭제 실패: ${d.error.message}` };
  }
  // 누락 그룹 삭제(멤버 cascade)
  const keepG = new Set(desiredGroups.map((g) => g.id));
  const existG = await supabase.from('people_groups').select('id');
  if (existG.error) return { ok: false, message: `조회 실패: ${existG.error.message}` };
  const delG = (existG.data ?? []).map((r) => r.id as string).filter((id) => !keepG.has(id));
  if (delG.length) {
    const d = await supabase.from('people_groups').delete().in('id', delG);
    if (d.error) return { ok: false, message: `그룹 삭제 실패: ${d.error.message}` };
  }

  revalidatePath('/', 'layout');
  return { ok: true, message: '저장되었습니다. 공개 페이지에 반영됩니다.' };
}
```

- [ ] **Step 2: `app/admin/lists/people/actions.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser, gUpsert, mUpsert, gSelect, mSelect, gDeleteIn, mDeleteIn, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
  gUpsert: vi.fn().mockResolvedValue({ error: null }),
  mUpsert: vi.fn().mockResolvedValue({ error: null }),
  gSelect: vi.fn().mockResolvedValue({ data: [{ id: 'g0' }], error: null }),
  mSelect: vi.fn().mockResolvedValue({ data: [{ id: 'g0m0' }, { id: 'old' }], error: null }),
  gDeleteIn: vi.fn().mockResolvedValue({ error: null }),
  mDeleteIn: vi.fn().mockResolvedValue({ error: null }),
  revalidatePath: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: (table: string) =>
      table === 'people_groups'
        ? { upsert: gUpsert, select: gSelect, delete: () => ({ in: gDeleteIn }) }
        : { upsert: mUpsert, select: mSelect, delete: () => ({ in: mDeleteIn }) },
  }),
}));

import { savePeople } from './actions';

function fd(groups: unknown) {
  const f = new FormData();
  f.set('groups', JSON.stringify(groups));
  return f;
}

beforeEach(() => {
  [gUpsert, mUpsert, gDeleteIn, mDeleteIn, revalidatePath].forEach((m) => m.mockClear());
});

describe('savePeople', () => {
  it('그룹·멤버를 sort_order와 함께 upsert하고 누락 멤버를 삭제한다', async () => {
    const res = await savePeople(
      { ok: false, message: '' },
      fd([{ id: 'g0', label: '헤더진', members: [{ id: 'g0m0', role: '연출', name: '정은수', bio: '' }] }])
    );
    expect(gUpsert).toHaveBeenCalledOnce();
    expect(gUpsert.mock.calls[0][0][0]).toMatchObject({ id: 'g0', label: '헤더진', sort_order: 0 });
    expect(mUpsert).toHaveBeenCalledOnce();
    expect(mUpsert.mock.calls[0][0][0]).toMatchObject({ id: 'g0m0', group_id: 'g0', role: '연출', name: '정은수', sort_order: 0 });
    // 기존 'old' 멤버는 제출 안 됨 → 삭제
    expect(mDeleteIn).toHaveBeenCalledWith('id', ['old']);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.ok).toBe(true);
  });
});
```

- [ ] **Step 3: 통과 + Commit**

Run: `npm test app/admin/lists/people/actions.test.ts` → PASS.
```bash
git add -A
git commit -m "feat: 참여자 명단 저장 서버 액션(그룹·멤버 정리) 추가"
```

---

## Task 2: PeopleEditor (중첩 편집기)

**Files:** Create `app/admin/lists/people/PeopleEditor.tsx`, `app/admin/lists/people/PeopleEditor.test.tsx`. 검증: `npm test`

- [ ] **Step 1: `app/admin/lists/people/PeopleEditor.tsx`**

```tsx
'use client';
import { useActionState, useState } from 'react';
import { savePeople, type SaveState } from './actions';

type Member = { _key: string; id: string; role: string; name: string; bio: string };
type Group = { _key: string; id: string; label: string; members: Member[] };
export type InitialGroup = { id: string; label: string; members: { id: string; role: string; name: string; bio: string }[] };

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'tmp-' + Math.random().toString(36).slice(2);
}

const initial: SaveState = { ok: false, message: '' };

export function PeopleEditor({ initialGroups }: { initialGroups: InitialGroup[] }) {
  const [groups, setGroups] = useState<Group[]>(() =>
    initialGroups.map((g) => ({
      _key: makeId(),
      id: g.id,
      label: g.label,
      members: g.members.map((m) => ({ _key: makeId(), id: m.id, role: m.role, name: m.name, bio: m.bio })),
    }))
  );
  const [state, formAction, pending] = useActionState(savePeople, initial);

  const upd = (fn: (gs: Group[]) => Group[]) => setGroups(fn);
  function addGroup() {
    const id = makeId();
    upd((gs) => [...gs, { _key: id, id, label: '새 그룹', members: [] }]);
  }
  function removeGroup(gk: string) {
    upd((gs) => gs.filter((g) => g._key !== gk));
  }
  function moveGroup(gk: string, dir: -1 | 1) {
    upd((gs) => {
      const i = gs.findIndex((g) => g._key === gk);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= gs.length) return gs;
      const c = [...gs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  }
  function setLabel(gk: string, label: string) {
    upd((gs) => gs.map((g) => (g._key === gk ? { ...g, label } : g)));
  }
  function addMember(gk: string) {
    const id = makeId();
    upd((gs) => gs.map((g) => (g._key === gk ? { ...g, members: [...g.members, { _key: id, id, role: '', name: '', bio: '' }] } : g)));
  }
  function removeMember(gk: string, mk: string) {
    upd((gs) => gs.map((g) => (g._key === gk ? { ...g, members: g.members.filter((m) => m._key !== mk) } : g)));
  }
  function moveMember(gk: string, mk: string, dir: -1 | 1) {
    upd((gs) =>
      gs.map((g) => {
        if (g._key !== gk) return g;
        const i = g.members.findIndex((m) => m._key === mk);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= g.members.length) return g;
        const c = [...g.members];
        [c[i], c[j]] = [c[j], c[i]];
        return { ...g, members: c };
      })
    );
  }
  function setMember(gk: string, mk: string, field: 'role' | 'name' | 'bio', value: string) {
    upd((gs) => gs.map((g) => (g._key === gk ? { ...g, members: g.members.map((m) => (m._key === mk ? { ...m, [field]: value } : m)) } : g)));
  }

  const payload = groups.map((g) => ({
    id: g.id,
    label: g.label,
    members: g.members.map((m) => ({ id: m.id, role: m.role, name: m.name, bio: m.bio })),
  }));

  const inputCls = 'min-h-[38px] px-2.5 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60';

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="groups" value={JSON.stringify(payload)} readOnly />
      {groups.map((g, gi) => (
        <div key={g._key} className="border border-gold/25 bg-velvet rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input value={g.label} onChange={(e) => setLabel(g._key, e.target.value)} aria-label="그룹 이름" className={`flex-1 font-display ${inputCls}`} />
            <button type="button" onClick={() => moveGroup(g._key, -1)} disabled={gi === 0} aria-label="그룹 위로" className="px-2 py-1 text-paper/70 disabled:opacity-30 hover:text-gold">↑</button>
            <button type="button" onClick={() => moveGroup(g._key, 1)} disabled={gi === groups.length - 1} aria-label="그룹 아래로" className="px-2 py-1 text-paper/70 disabled:opacity-30 hover:text-gold">↓</button>
            <button type="button" onClick={() => removeGroup(g._key)} aria-label="그룹 삭제" className="px-2 py-1 text-[13px] text-red-400/80 hover:text-red-400">그룹 삭제</button>
          </div>
          <div className="flex flex-col gap-2 pl-3 border-l border-gold/15">
            {g.members.map((m, mi) => (
              <div key={m._key} className="flex flex-col gap-1.5 bg-stage/40 rounded-sm p-2">
                <div className="flex gap-2 items-center">
                  <input value={m.role} onChange={(e) => setMember(g._key, m._key, 'role', e.target.value)} placeholder="역할(선택)" aria-label="역할" className={`w-[34%] ${inputCls}`} />
                  <input value={m.name} onChange={(e) => setMember(g._key, m._key, 'name', e.target.value)} placeholder="이름" aria-label="이름" className={`flex-1 ${inputCls}`} />
                  <button type="button" onClick={() => moveMember(g._key, m._key, -1)} disabled={mi === 0} aria-label="멤버 위로" className="px-1.5 text-paper/70 disabled:opacity-30 hover:text-gold">↑</button>
                  <button type="button" onClick={() => moveMember(g._key, m._key, 1)} disabled={mi === g.members.length - 1} aria-label="멤버 아래로" className="px-1.5 text-paper/70 disabled:opacity-30 hover:text-gold">↓</button>
                  <button type="button" onClick={() => removeMember(g._key, m._key)} aria-label="멤버 삭제" className="px-1.5 text-[12px] text-red-400/80 hover:text-red-400">삭제</button>
                </div>
                <textarea value={m.bio} onChange={(e) => setMember(g._key, m._key, 'bio', e.target.value)} placeholder="약력(선택)" aria-label="약력" rows={1} className={`${inputCls} py-1.5 resize-y`} />
              </div>
            ))}
            <button type="button" onClick={() => addMember(g._key)} className="min-h-[36px] border border-dashed border-gold/30 text-gold text-[13px] rounded-sm hover:bg-gold/[0.08]">+ 멤버 추가</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addGroup} className="min-h-[44px] border border-dashed border-gold/40 text-gold text-sm rounded-sm hover:bg-gold/[0.08]">+ 그룹 추가</button>
      <div className="flex items-center gap-4 sticky bottom-0 bg-stage/90 backdrop-blur py-4">
        <button type="submit" disabled={pending} className="min-h-[48px] px-6 bg-gold text-ink font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60">
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.message && <span className={`text-sm ${state.ok ? 'text-gold' : 'text-red-400'}`}>{state.message}</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: `app/admin/lists/people/PeopleEditor.test.tsx`**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./actions', () => ({ savePeople: vi.fn() }));
import { PeopleEditor } from './PeopleEditor';

const initial = [{ id: 'g0', label: '헤더진', members: [{ id: 'g0m0', role: '연출', name: '정은수', bio: '' }] }];

describe('PeopleEditor', () => {
  it('그룹 라벨과 멤버 값, 저장 버튼을 렌더한다', () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getByDisplayValue('헤더진')).toBeInTheDocument();
    expect(screen.getByDisplayValue('정은수')).toBeInTheDocument();
    expect(screen.getByDisplayValue('연출')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('멤버 추가/삭제가 동작한다', async () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getAllByLabelText('이름').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 멤버 추가' }));
    expect(screen.getAllByLabelText('이름').length).toBe(2);
    await userEvent.click(screen.getAllByRole('button', { name: '멤버 삭제' })[1]);
    expect(screen.getAllByLabelText('이름').length).toBe(1);
  });

  it('그룹 추가가 동작한다', async () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getAllByLabelText('그룹 이름').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 그룹 추가' }));
    expect(screen.getAllByLabelText('그룹 이름').length).toBe(2);
  });
});
```

- [ ] **Step 3: 통과 + Commit**

Run: `npm test app/admin/lists/people/PeopleEditor.test.tsx` → PASS.
```bash
git add -A
git commit -m "feat: 참여자 명단 중첩 편집기(PeopleEditor) 추가"
```

---

## Task 3: 라우트 + 허브 링크

**Files:** Create `app/admin/lists/people/page.tsx`; Modify `app/admin/page.tsx`. 검증: `npm run build`, `npm test`

- [ ] **Step 1: `app/admin/lists/people/page.tsx`**

```tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PeopleEditor, type InitialGroup } from './PeopleEditor';

export default async function PeopleAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const [{ data: groups }, { data: members }] = await Promise.all([
    supabase.from('people_groups').select('id,label,sort_order').order('sort_order'),
    supabase.from('people_members').select('id,group_id,role,name,bio,sort_order').order('sort_order'),
  ]);
  const initialGroups: InitialGroup[] = (groups ?? []).map((g) => ({
    id: g.id,
    label: g.label,
    members: (members ?? [])
      .filter((m) => m.group_id === g.id)
      .map((m) => ({ id: m.id, role: m.role ?? '', name: m.name ?? '', bio: m.bio ?? '' })),
  }));

  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <Link href="/admin" className="font-mono text-[11px] text-gold">← 관리자</Link>
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mt-3 mb-2">참여자 명단</h1>
      <p className="text-sm text-paper/60 mb-8">그룹·개인 추가 · 수정 · 삭제 · 순서변경 후 저장하면 즉시 반영됩니다. (사진은 다음 단계)</p>
      <PeopleEditor initialGroups={initialGroups} />
    </section>
  );
}
```
참고: 정적 세그먼트 `people`는 동적 `[list]`보다 우선하므로 `/admin/lists/people`는 이 페이지가 처리한다.

- [ ] **Step 2: `app/admin/page.tsx` 허브에 참여자 명단 링크 추가**

목록 편집 섹션에서 `ADMIN_LISTS`를 map하는 grid 아래(또는 그 안)에 참여자 명단 링크를 추가하고, "참여자 명단(중첩)은 다음 단계(3B-3)에서 추가됩니다" 안내 문구는 제거. 예: grid 다음에
```tsx
          <Link
            href="/admin/lists/people"
            className="mt-2 block border border-gold/25 bg-velvet rounded-sm px-4 py-3 text-sm text-paper hover:border-gold/55 transition-colors"
          >
            참여자 명단 (그룹 · 개인)
          </Link>
```
(기존 "다음 단계(3B-3)…" `<p>`는 삭제.)

- [ ] **Step 3: 빌드 + 테스트**

Run: `npm run build` → 성공(`/admin/lists/people` 라우트 생성, `[list]`와 공존). 필요 시 `rm -rf .next` 후 재빌드.
Run: `npm test` → 전체 통과.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 참여자 명단 편집 라우트와 허브 링크 구성"
```

---

## Task 4: 검증 · README

**Files:** Modify `README.md`. 검증만.

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과. Run: `npm run build` → 성공.

- [ ] **Step 2: README 갱신**

- 관리자 절: `/admin` 허브 → "참여자 명단"에서 그룹·개인(역할·이름·약력)을 추가/수정/삭제/순서변경. 저장 시 즉시 반영. 사진은 3C.
- 로드맵: Phase 3B-3b(완료), 3C(사진) 예정.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: 참여자 명단 편집 사용 안내 추가"
```

---

## 후속 (별도 계획)

- **Phase 3C** — 사진 업로드(Storage `images`): characters·people_members의 `photo_url` 채우기. 편집기(인물 목록·PeopleEditor)에 이미지 업로드 UI 추가.

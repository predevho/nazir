# 〈나지르〉 Phase 3B-5 — 약력 항목 편집기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 참여자 약력 입력을 "마크다운 통째 작성"에서 **항목별 줄 추가**로 바꾼다. 관리자는 텍스트만 입력하고, 각 항목은 저장 시 `- 항목`으로 직렬화되어 공개 페이지에 **• 불릿**으로 표시된다(표시 코드 MarkdownText는 그대로).

**Architecture:** `PeopleEditor`의 멤버 상태에서 `bio`를 문자열 → **줄 배열(BioLine[])** 로 관리. 초기 로드 시 기존 bio 문자열을 파싱해 줄로, 제출 시 `- 줄` 마크다운으로 직렬화. 서버 액션 `savePeople`은 변경 없음(bio는 여전히 문자열로 전달됨). 등장인물 설명은 산문형이라 3B-4의 마크다운 textarea 그대로.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest.

**핵심 결정**
- bio 저장 형식은 `- 줄1\n- 줄2`(마크다운 불릿). DB 스키마·표시·savePeople 불변.
- 자동 불릿: 관리자는 텍스트만 입력, 직렬화에서 `- ` 자동 부여.
- 커밋 메시지 한글 + 타입 접두사.

**전제:** `main`(3B-4 완료). 작업은 새 브랜치.

---

## File Structure

| 경로 | 상태 | 책임 |
|------|------|------|
| `app/admin/lists/people/PeopleEditor.tsx` | 교체 | 약력을 항목별 줄 편집기로(파싱·직렬화 포함) |
| `app/admin/lists/people/PeopleEditor.test.tsx` | 수정 | 약력 항목 추가 테스트 추가 |

(변경 없음: `savePeople`, 표시(`MarkdownText`, /process, /about), 등장인물 설명 입력.)

---

## Task 1: PeopleEditor 약력 항목 편집기

**Files:** Replace `app/admin/lists/people/PeopleEditor.tsx`; Modify `app/admin/lists/people/PeopleEditor.test.tsx`. 검증: `npm test`, `npm run build`

- [ ] **Step 1: `app/admin/lists/people/PeopleEditor.tsx`를 아래로 전체 교체**

```tsx
'use client';
import { useActionState, useState } from 'react';
import { savePeople, type SaveState } from './actions';

type BioLine = { _key: string; text: string };
type Member = { _key: string; id: string; role: string; name: string; bio: BioLine[] };
type Group = { _key: string; id: string; label: string; members: Member[] };
export type InitialGroup = { id: string; label: string; members: { id: string; role: string; name: string; bio: string }[] };

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'tmp-' + Math.random().toString(36).slice(2);
}

/** 저장된 bio 문자열(마크다운 불릿)을 편집용 줄 배열로. 앞의 -,*,+ 마커는 제거. */
function parseBio(bio: string): BioLine[] {
  if (!bio || !bio.trim()) return [];
  return bio
    .split('\n')
    .map((l) => l.replace(/^\s*[-*+]\s+/, '').trim())
    .filter((l) => l !== '')
    .map((text) => ({ _key: makeId(), text }));
}

/** 줄 배열을 `- 줄` 마크다운으로. 빈 줄은 제외. */
function serializeBio(bio: BioLine[]): string {
  return bio
    .map((b) => b.text.trim())
    .filter(Boolean)
    .map((l) => `- ${l}`)
    .join('\n');
}

const initial: SaveState = { ok: false, message: '' };

export function PeopleEditor({ initialGroups }: { initialGroups: InitialGroup[] }) {
  const [groups, setGroups] = useState<Group[]>(() =>
    initialGroups.map((g) => ({
      _key: makeId(),
      id: g.id,
      label: g.label,
      members: g.members.map((m) => ({ _key: makeId(), id: m.id, role: m.role, name: m.name, bio: parseBio(m.bio) })),
    }))
  );
  const [state, formAction, pending] = useActionState(savePeople, initial);

  const setG = (fn: (gs: Group[]) => Group[]) => setGroups(fn);
  function updateMember(gk: string, mk: string, fn: (m: Member) => Member) {
    setG((gs) => gs.map((g) => (g._key === gk ? { ...g, members: g.members.map((m) => (m._key === mk ? fn(m) : m)) } : g)));
  }
  function addGroup() {
    const id = makeId();
    setG((gs) => [...gs, { _key: id, id, label: '새 그룹', members: [] }]);
  }
  function removeGroup(gk: string) {
    setG((gs) => gs.filter((g) => g._key !== gk));
  }
  function moveGroup(gk: string, dir: -1 | 1) {
    setG((gs) => {
      const i = gs.findIndex((g) => g._key === gk);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= gs.length) return gs;
      const c = [...gs];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
  }
  function setLabel(gk: string, label: string) {
    setG((gs) => gs.map((g) => (g._key === gk ? { ...g, label } : g)));
  }
  function addMember(gk: string) {
    const id = makeId();
    setG((gs) => gs.map((g) => (g._key === gk ? { ...g, members: [...g.members, { _key: id, id, role: '', name: '', bio: [] }] } : g)));
  }
  function removeMember(gk: string, mk: string) {
    setG((gs) => gs.map((g) => (g._key === gk ? { ...g, members: g.members.filter((m) => m._key !== mk) } : g)));
  }
  function moveMember(gk: string, mk: string, dir: -1 | 1) {
    setG((gs) =>
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
  function setField(gk: string, mk: string, field: 'role' | 'name', value: string) {
    updateMember(gk, mk, (m) => ({ ...m, [field]: value }));
  }
  function addBio(gk: string, mk: string) {
    updateMember(gk, mk, (m) => ({ ...m, bio: [...m.bio, { _key: makeId(), text: '' }] }));
  }
  function removeBio(gk: string, mk: string, bk: string) {
    updateMember(gk, mk, (m) => ({ ...m, bio: m.bio.filter((b) => b._key !== bk) }));
  }
  function setBio(gk: string, mk: string, bk: string, text: string) {
    updateMember(gk, mk, (m) => ({ ...m, bio: m.bio.map((b) => (b._key === bk ? { ...b, text } : b)) }));
  }
  function moveBio(gk: string, mk: string, bk: string, dir: -1 | 1) {
    updateMember(gk, mk, (m) => {
      const i = m.bio.findIndex((b) => b._key === bk);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= m.bio.length) return m;
      const c = [...m.bio];
      [c[i], c[j]] = [c[j], c[i]];
      return { ...m, bio: c };
    });
  }

  const payload = groups.map((g) => ({
    id: g.id,
    label: g.label,
    members: g.members.map((m) => ({ id: m.id, role: m.role, name: m.name, bio: serializeBio(m.bio) })),
  }));

  const inputCls = 'min-h-[38px] px-2.5 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60';
  const iconBtn = 'px-1.5 text-paper/70 disabled:opacity-30 hover:text-gold';

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="groups" value={JSON.stringify(payload)} readOnly />
      {groups.map((g, gi) => (
        <div key={g._key} className="border border-gold/25 bg-velvet rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input value={g.label} onChange={(e) => setLabel(g._key, e.target.value)} aria-label="그룹 이름" className={`flex-1 font-display ${inputCls}`} />
            <button type="button" onClick={() => moveGroup(g._key, -1)} disabled={gi === 0} aria-label="그룹 위로" className={iconBtn}>↑</button>
            <button type="button" onClick={() => moveGroup(g._key, 1)} disabled={gi === groups.length - 1} aria-label="그룹 아래로" className={iconBtn}>↓</button>
            <button type="button" onClick={() => removeGroup(g._key)} aria-label="그룹 삭제" className="px-2 py-1 text-[13px] text-red-400/80 hover:text-red-400">그룹 삭제</button>
          </div>
          <div className="flex flex-col gap-3 pl-3 border-l border-gold/15">
            {g.members.map((m, mi) => (
              <div key={m._key} className="flex flex-col gap-2 bg-stage/40 rounded-sm p-2.5">
                <div className="flex gap-2 items-center">
                  <input value={m.role} onChange={(e) => setField(g._key, m._key, 'role', e.target.value)} placeholder="역할(선택)" aria-label="역할" className={`w-[34%] ${inputCls}`} />
                  <input value={m.name} onChange={(e) => setField(g._key, m._key, 'name', e.target.value)} placeholder="이름" aria-label="이름" className={`flex-1 ${inputCls}`} />
                  <button type="button" onClick={() => moveMember(g._key, m._key, -1)} disabled={mi === 0} aria-label="멤버 위로" className={iconBtn}>↑</button>
                  <button type="button" onClick={() => moveMember(g._key, m._key, 1)} disabled={mi === g.members.length - 1} aria-label="멤버 아래로" className={iconBtn}>↓</button>
                  <button type="button" onClick={() => removeMember(g._key, m._key)} aria-label="멤버 삭제" className="px-1.5 text-[12px] text-red-400/80 hover:text-red-400">삭제</button>
                </div>
                <div className="flex flex-col gap-1.5 pl-1">
                  <span className="font-mono text-[10px] text-paper/40">약력 (항목별 · 불릿으로 표시됨)</span>
                  {m.bio.map((b, bi) => (
                    <div key={b._key} className="flex gap-1.5 items-center">
                      <span className="text-gold/50 text-xs select-none">•</span>
                      <input value={b.text} onChange={(e) => setBio(g._key, m._key, b._key, e.target.value)} placeholder="예: 2025 Praysound 리더" aria-label="약력 항목" className={`flex-1 ${inputCls}`} />
                      <button type="button" onClick={() => moveBio(g._key, m._key, b._key, -1)} disabled={bi === 0} aria-label="약력 위로" className={iconBtn}>↑</button>
                      <button type="button" onClick={() => moveBio(g._key, m._key, b._key, 1)} disabled={bi === m.bio.length - 1} aria-label="약력 아래로" className={iconBtn}>↓</button>
                      <button type="button" onClick={() => removeBio(g._key, m._key, b._key)} aria-label="약력 항목 삭제" className="px-1.5 text-[12px] text-red-400/80 hover:text-red-400">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addBio(g._key, m._key)} className="self-start min-h-[32px] px-3 border border-dashed border-gold/30 text-gold text-[12px] rounded-sm hover:bg-gold/[0.08]">+ 약력 항목</button>
                </div>
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

- [ ] **Step 2: `app/admin/lists/people/PeopleEditor.test.tsx`에 약력 항목 테스트 추가**

기존 테스트(그룹 라벨·이름·역할·저장 버튼, 멤버/그룹 추가·삭제)는 그대로 통과해야 한다(초기 bio=''→항목 0개, 이름/역할 입력 그대로). describe 블록 안에 아래 it을 추가:
```tsx
  it('약력 항목을 추가할 수 있다', async () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.queryAllByLabelText('약력 항목').length).toBe(0);
    await userEvent.click(screen.getByRole('button', { name: '+ 약력 항목' }));
    expect(screen.getAllByLabelText('약력 항목').length).toBe(1);
  });
```
(파일 상단에 `userEvent`가 이미 import돼 있는지 확인 — 기존 멤버 추가/삭제 테스트에서 사용 중이라 있음.)

- [ ] **Step 3: 테스트 + 빌드**

Run: `npm test app/admin/lists/people/PeopleEditor.test.tsx` → PASS(기존 + 신규).
Run: `npm test` → 전체 통과. Run: `npm run build` → 성공.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: 참여자 약력을 항목별 줄 편집기로 변경(자동 불릿)"
```

---

## Task 2: 검증 · README

**Files:** Modify `README.md`. 검증만.

- [ ] **Step 1: 전체 테스트 + 빌드**

Run: `npm test` → 전부 통과. Run: `npm run build` → 성공.

- [ ] **Step 2: README 약력 안내 갱신**

- 3B-4의 "약력 마크다운" 설명에서, 참여자 약력은 **항목별로 한 줄씩 추가**하면 각 줄이 자동으로 **• 불릿**으로 표시된다고 갱신(관리자는 마크다운 문법 불필요). 등장인물 설명은 마크다운 textarea 유지.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: 약력 항목별 입력 안내로 갱신"
```

---

## 후속

- **Phase 3C** — 사진 업로드(Storage `images`): characters·people_members의 `photo_url` 채우기.

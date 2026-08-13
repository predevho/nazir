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
                <textarea
                  value={m.bio}
                  onChange={(e) => setMember(g._key, m._key, 'bio', e.target.value)}
                  placeholder="약력 · 마크다운 지원 (예: - 2025 …)"
                  aria-label="약력"
                  rows={5}
                  className={`${inputCls} py-2 font-mono resize-y`}
                />
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

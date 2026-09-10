'use client';
import { useActionState, useState } from 'react';
import { savePeople, type SaveState } from './actions';
import { PhotoField } from '../PhotoField';
import { ListToolbar } from '../ListToolbar';
import { ListPager } from '../ListPager';
import { applyView, moveWithinVisible, EMPTY_VIEW, type ViewState } from '@/lib/adminView';

type BioLine = { _key: string; text: string };
type Member = { _key: string; id: string; role: string; team: string; name: string; tagline: string; bio: BioLine[]; photoUrl: string };
type Group = { _key: string; id: string; label: string; members: Member[] };
export type InitialGroup = { id: string; label: string; members: { id: string; role: string; team: string; name: string; tagline: string; bio: string; photo_url: string | null }[] };

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
      members: g.members.map((m) => ({ _key: makeId(), id: m.id, role: m.role, team: m.team, name: m.name, tagline: m.tagline, bio: parseBio(m.bio), photoUrl: m.photo_url ?? '' })),
    }))
  );
  const [state, formAction, pending] = useActionState(savePeople, initial);

  /*
    43명이 한 화면에 쏟아지던 것을 끊는다. 그룹마다 따로 센다 —
    헤더진 8 / 스탭진 18 / 배우 17 이라 한 덩어리로 묶으면 그룹 경계가 흐려진다.
    찾기는 그룹을 가로질러 걸린다(이름·역할·세부팀).
    저장은 화면과 무관하게 groups 전체를 보낸다 — 아래 payload 참고.
  */
  const [views, setViews] = useState<Record<string, ViewState>>({});
  const viewOf = (key: string) => views[key] ?? EMPTY_VIEW;
  const setView = (key: string, next: Partial<ViewState>) =>
    setViews((vs) => ({ ...vs, [key]: { ...(vs[key] ?? EMPTY_VIEW), ...next } }));

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
    setG((gs) => gs.map((g) => (g._key === gk ? { ...g, members: [...g.members, { _key: id, id, role: '', team: '', name: '', tagline: '', bio: [], photoUrl: '' }] } : g)));
  }
  function removeMember(gk: string, mk: string) {
    setG((gs) => gs.map((g) => (g._key === gk ? { ...g, members: g.members.filter((m) => m._key !== mk) } : g)));
  }
  function moveMember(gk: string, mk: string, dir: -1 | 1, visible: Member[]) {
    // 보이는 목록의 이웃과 바꾼다. 전체에서 앞뒤를 바꾸면 찾기가 걸렸을 때
    // 안 보이는 멤버와 자리를 바꾸게 되고, 누른 사람 눈에는 아무 일도 안 일어난다.
    setG((gs) =>
      gs.map((g) =>
        g._key === gk ? { ...g, members: moveWithinVisible(g.members, visible, mk, dir, (x) => x._key) } : g,
      ),
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
  function setPhoto(gk: string, mk: string, url: string) {
    updateMember(gk, mk, (m) => ({ ...m, photoUrl: url }));
  }
  function setTeam(gk: string, mk: string, value: string) {
    updateMember(gk, mk, (m) => ({ ...m, team: value }));
  }
  function setTagline(gk: string, mk: string, value: string) {
    updateMember(gk, mk, (m) => ({ ...m, tagline: value }));
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
    members: g.members.map((m) => ({ id: m.id, role: m.role, team: m.team, name: m.name, tagline: m.tagline, bio: serializeBio(m.bio), photoUrl: m.photoUrl })),
  }));

  const inputCls = 'min-h-[38px] px-2.5 bg-ds-bg border border-ds-key2/25 rounded-sm text-ds-text text-sm outline-none focus:border-ds-key2/60';
  const iconBtn = 'px-1.5 text-ds-text/70 disabled:opacity-30 hover:opacity-80';

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="groups" value={JSON.stringify(payload)} readOnly />
      {groups.map((g, gi) => (
        <div key={g._key} className="border border-ds-key2/25 bg-ds-panel rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input value={g.label} onChange={(e) => setLabel(g._key, e.target.value)} aria-label="그룹 이름" className={`flex-1 font-heir ${inputCls}`} />
            <button type="button" onClick={() => moveGroup(g._key, -1)} disabled={gi === 0} aria-label="그룹 위로" className={iconBtn}>↑</button>
            <button type="button" onClick={() => moveGroup(g._key, 1)} disabled={gi === groups.length - 1} aria-label="그룹 아래로" className={iconBtn}>↓</button>
            <button type="button" onClick={() => removeGroup(g._key)} aria-label="그룹 삭제" className="px-2 py-1 text-[13px] text-red-400/80 hover:text-red-400">그룹 삭제</button>
          </div>
          <div className="flex flex-col gap-3 pl-3 border-l border-ds-key2/15">
            {(() => {
              const res = applyView(g.members, viewOf(g._key), {
                text: (m) => `${m.name} ${m.role} ${m.team} ${m.tagline}`,
              });
              return (
                <>
                  <ListToolbar
                    view={{ ...viewOf(g._key), page: res.page }}
                    onChange={(next) => setView(g._key, next)}
                    total={res.total}
                    matched={res.matched.length}
                    pages={res.pages}
                  />
                  {res.matched.length === 0 && g.members.length > 0 && (
                    <p className="px-3 py-4 text-center text-[13px] text-ds-text/50">
                      찾는 사람이 없습니다.
                    </p>
                  )}
                  {res.visible.map((m) => {
                    const mi = res.visible.indexOf(m);
                    return (
              <div key={m._key} className="flex flex-col gap-2 bg-ds-bg/40 rounded-sm p-2.5">
                <div className="flex gap-2 items-center">
                  <input value={m.role} onChange={(e) => setField(g._key, m._key, 'role', e.target.value)} placeholder="역할(선택)" aria-label="역할" className={`w-[34%] ${inputCls}`} />
                  <input value={m.name} onChange={(e) => setField(g._key, m._key, 'name', e.target.value)} placeholder="이름" aria-label="이름" className={`flex-1 ${inputCls}`} />
                  <button type="button" onClick={() => moveMember(g._key, m._key, -1, res.visible)} disabled={mi === 0} aria-label="멤버 위로" className={iconBtn}>↑</button>
                  <button type="button" onClick={() => moveMember(g._key, m._key, 1, res.visible)} disabled={mi === res.visible.length - 1} aria-label="멤버 아래로" className={iconBtn}>↓</button>
                  <button type="button" onClick={() => removeMember(g._key, m._key)} aria-label="멤버 삭제" className="px-1.5 text-[12px] text-red-400/80 hover:text-red-400">삭제</button>
                </div>
                <div className="flex gap-2 items-center">
                  <input value={m.team} onChange={(e) => setTeam(g._key, m._key, e.target.value)} placeholder="세부팀(선택, 예: 연출팀)" aria-label="세부팀" className={`w-[34%] ${inputCls}`} />
                  <input value={m.tagline} onChange={(e) => setTagline(g._key, m._key, e.target.value)} placeholder="한 줄 소개(선택)" aria-label="한 줄 소개" className={`flex-1 ${inputCls}`} />
                </div>
                <PhotoField kind="people" id={m.id} value={m.photoUrl} onChange={(url) => setPhoto(g._key, m._key, url)} />
                <div className="flex flex-col gap-1.5 pl-1">
                  <span className="text-[11px] text-ds-text/40">약력 (항목별 · 불릿으로 표시됨)</span>
                  {m.bio.map((b, bi) => (
                    <div key={b._key} className="flex gap-1.5 items-center">
                      <span className="text-ds-key2/50 text-xs select-none">•</span>
                      <input value={b.text} onChange={(e) => setBio(g._key, m._key, b._key, e.target.value)} placeholder="예: 2025 Praysound 리더" aria-label="약력 항목" className={`flex-1 ${inputCls}`} />
                      <button type="button" onClick={() => moveBio(g._key, m._key, b._key, -1)} disabled={bi === 0} aria-label="약력 위로" className={iconBtn}>↑</button>
                      <button type="button" onClick={() => moveBio(g._key, m._key, b._key, 1)} disabled={bi === m.bio.length - 1} aria-label="약력 아래로" className={iconBtn}>↓</button>
                      <button type="button" onClick={() => removeBio(g._key, m._key, b._key)} aria-label="약력 항목 삭제" className="px-1.5 text-[12px] text-red-400/80 hover:text-red-400">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addBio(g._key, m._key)} className="self-start min-h-[32px] px-3 border border-dashed border-ds-key2/30 text-ds-key2 text-[12px] rounded-sm hover:bg-ds-key2/[0.08]">+ 약력 항목</button>
                </div>
              </div>
                    );
                  })}
                  <ListPager
                    page={res.page}
                    pages={res.pages}
                    onChange={(page) => setView(g._key, { page })}
                  />
                </>
              );
            })()}
            <button type="button" onClick={() => addMember(g._key)} className="min-h-[36px] border border-dashed border-ds-key2/30 text-ds-key2 text-[13px] rounded-sm hover:bg-ds-key2/[0.08]">+ 멤버 추가</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addGroup} className="min-h-[44px] border border-dashed border-ds-key2/40 text-ds-key2 text-sm rounded-sm hover:bg-ds-key2/[0.08]">+ 그룹 추가</button>
      <div className="flex items-center gap-4 sticky bottom-0 bg-ds-bg/90 backdrop-blur py-4">
        <button type="submit" disabled={pending} className="min-h-[48px] px-6 bg-ds-key2 text-ds-key1 font-medium rounded-sm hover:opacity-90 transition-colors disabled:opacity-60">
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.message && <span className={`text-sm ${state.ok ? 'text-ds-key2' : 'text-red-400'}`}>{state.message}</span>}
      </div>
    </form>
  );
}

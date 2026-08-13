'use client';
import { useActionState, useState } from 'react';
import type { ListConfig } from '@/lib/adminLists';
import { saveList, type SaveState } from './actions';
import { PhotoField } from './PhotoField';

type Row = { _key: string; id: string } & Record<string, string>;

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'tmp-' + Math.random().toString(36).slice(2);
}

function toRow(config: ListConfig, r: Record<string, string>): Row {
  const row = { _key: makeId(), id: r.id ?? '' } as Row;
  for (const c of config.columns) row[c.key] = r[c.key] ?? '';
  return row;
}

const initial: SaveState = { ok: false, message: '' };

export function ListEditor({ config, initialRows }: { config: ListConfig; initialRows: Record<string, string>[] }) {
  const [rows, setRows] = useState<Row[]>(() => initialRows.map((r) => toRow(config, r)));
  const [state, formAction, pending] = useActionState(saveList, initial);

  function addRow() {
    const row = { _key: makeId(), id: makeId() } as Row;
    for (const c of config.columns) row[c.key] = c.type === 'select' ? c.options?.[0]?.value ?? '' : '';
    setRows((rs) => [...rs, row]);
  }
  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r._key !== key));
  }
  function move(key: string, dir: -1 | 1) {
    setRows((rs) => {
      const i = rs.findIndex((r) => r._key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= rs.length) return rs;
      const copy = [...rs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }
  function setVal(key: string, col: string, value: string) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, [col]: value } : r)));
  }

  const payload = rows.map((r) => {
    const o: Record<string, string> = { id: r.id };
    for (const c of config.columns) o[c.key] = r[c.key] ?? '';
    return o;
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="listKey" value={config.key} />
      <input type="hidden" name="rows" value={JSON.stringify(payload)} readOnly />
      {rows.map((row, idx) => (
        <div key={row._key} className="border border-gold/20 bg-velvet rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-paper/40">#{idx + 1}</span>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(row._key, -1)} disabled={idx === 0} aria-label="위로 이동" className="px-2 py-1 text-paper/70 disabled:opacity-30 hover:text-gold">↑</button>
              <button type="button" onClick={() => move(row._key, 1)} disabled={idx === rows.length - 1} aria-label="아래로 이동" className="px-2 py-1 text-paper/70 disabled:opacity-30 hover:text-gold">↓</button>
              <button type="button" onClick={() => removeRow(row._key)} aria-label="행 삭제" className="px-2 py-1 text-[13px] text-red-400/80 hover:text-red-400">삭제</button>
            </div>
          </div>
          {config.columns.map((c) => (
            <label key={c.key} className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-[0.1em] text-paper/50">{c.label}</span>
              {c.type === 'image' ? (
                <PhotoField kind="characters" id={row.id} value={row[c.key] ?? ''} onChange={(url) => setVal(row._key, c.key, url)} />
              ) : c.type === 'textarea' ? (
                <>
                  <textarea
                    value={row[c.key] ?? ''}
                    onChange={(e) => setVal(row._key, c.key, e.target.value)}
                    rows={c.markdown ? 6 : 2}
                    placeholder={c.markdown ? '마크다운 지원 (예: - 항목)' : undefined}
                    className={`px-3 py-2 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60 resize-y ${c.markdown ? 'font-mono' : ''}`}
                  />
                  {c.markdown && <span className="font-mono text-[10px] text-paper/35">마크다운 지원 · 불릿(- ), 굵게(**텍스트**)</span>}
                </>
              ) : c.type === 'select' ? (
                <select value={row[c.key] ?? ''} onChange={(e) => setVal(row._key, c.key, e.target.value)} className="min-h-[40px] px-3 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60">
                  {c.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={row[c.key] ?? ''} onChange={(e) => setVal(row._key, c.key, e.target.value)} className="min-h-[40px] px-3 bg-stage border border-gold/25 rounded-sm text-paper text-sm outline-none focus:border-gold/60" />
              )}
            </label>
          ))}
        </div>
      ))}
      <button type="button" onClick={addRow} className="min-h-[44px] border border-dashed border-gold/40 text-gold text-sm rounded-sm hover:bg-gold/[0.08]">+ 행 추가</button>
      <div className="flex items-center gap-4 sticky bottom-0 bg-stage/90 backdrop-blur py-4">
        <button type="submit" disabled={pending} className="min-h-[48px] px-6 bg-gold text-ink font-medium rounded-sm hover:bg-gold-soft transition-colors disabled:opacity-60">
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.message && <span className={`text-sm ${state.ok ? 'text-gold' : 'text-red-400'}`}>{state.message}</span>}
      </div>
    </form>
  );
}

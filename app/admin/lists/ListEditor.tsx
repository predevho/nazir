'use client';
import { useActionState, useState } from 'react';
import type { ListConfig } from '@/lib/adminLists';
import { saveList, type SaveState } from './actions';
import { PhotoField } from './PhotoField';
import { ListToolbar } from './ListToolbar';
import { ListPager } from './ListPager';
import { ListPreview, type PreviewSite } from './ListPreview';
import { applyView, moveWithinVisible, sortForView, ADMIN_PAGE_SIZE, EMPTY_VIEW, type ViewState } from '@/lib/adminView';

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

export function ListEditor({
  config,
  initialRows,
  site,
}: {
  config: ListConfig;
  initialRows: Record<string, string>[];
  /** 미리보기 카드가 쓰는, 이 목록 밖의 값(총액·안내 문구). */
  site: PreviewSite;
}) {
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
    // 보이는 목록의 이웃과 바꾼다. 전체 배열에서 앞뒤를 바꾸면 필터가 걸렸을 때
    // 안 보이는 행과 자리를 바꾸게 되고, 누른 사람 눈에는 아무 일도 안 일어난다.
    setRows((rs) => moveWithinVisible(rs, visible, key, dir, (r) => r._key));
  }
  function setVal(key: string, col: string, value: string) {
    setRows((rs) => rs.map((r) => (r._key === key ? { ...r, [col]: value } : r)));
  }

  /*
    보기 상태. 저장과는 무관하다 — payload 는 아래에서 rows 전체로 만든다.
    셀렉트 칸이 있으면 그것을 필터 기준으로 삼는다(제작 일정의 상태, 편지의 들어갈 페이지).
  */
  const [view, setView] = useState<ViewState>(EMPTY_VIEW);
  const [grouped, setGrouped] = useState(false);
  const facetCol = config.columns.find((c) => c.type === 'select');

  const ordered = grouped && facetCol
    ? sortForView(rows, facetCol.options?.map((o) => o.value) ?? null, (r) => r[facetCol.key] ?? '')
    : rows;

  /*
    한 화면에 다 들어오고 거를 기준도 없는 목록에는 툴바를 두지 않는다.
    작품 개요(5) · 제작 예산(8) · 기도 제목(6) 처럼 짧은 목록에서 찾기 칸은
    자리만 차지하고 하는 일이 없다. 늘어나면 저절로 다시 나타난다.
  */
  const needsToolbar = rows.length > ADMIN_PAGE_SIZE || Boolean(facetCol);

  const result = applyView(ordered, view, {
    text: (r) => config.columns.map((c) => r[c.key] ?? '').join(' '),
    facet: facetCol ? (r) => r[facetCol.key] ?? '' : undefined,
  });
  const visible = result.visible;

  const payload = rows.map((r) => {
    const o: Record<string, string> = { id: r.id };
    for (const c of config.columns) o[c.key] = r[c.key] ?? '';
    return o;
  });

  return (
    /*
      넓은 화면에서는 편집기 오른쪽이 통째로 비어 있었다. 그 자리에 미리보기를 세운다.
      xl 아래에서는 한 칸으로 떨어지고 미리보기는 스스로 숨는다.
    */
    <form action={formAction} className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
      <div className="flex min-w-0 flex-col gap-4">
      <input type="hidden" name="listKey" value={config.key} />
      <input type="hidden" name="rows" value={JSON.stringify(payload)} readOnly />

      {needsToolbar && (
      <ListToolbar
        view={{ ...view, page: result.page }}
        onChange={(next) => setView((v) => ({ ...v, ...next }))}
        total={result.total}
        matched={result.matched.length}
        pages={result.pages}
        facetLabel={facetCol?.label}
        facetOptions={facetCol?.options}
        sortLabel={facetCol ? `${facetCol.label}별로 모아 보기` : undefined}
        sortOn={grouped}
        onToggleSort={facetCol ? () => setGrouped((g) => !g) : undefined}
      />
      )}

      {result.matched.length === 0 && (
        <p className="border border-ds-key2/15 bg-ds-panel/60 px-4 py-6 text-center text-sm text-ds-text/50">
          찾는 것이 없습니다. 검색어나 분류를 바꿔 보세요.
        </p>
      )}

      {visible.map((row) => {
        const idx = rows.indexOf(row);
        const vi = visible.indexOf(row);
        return (
        <div key={row._key} className="border border-ds-key2/20 bg-ds-panel rounded-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ds-text/40">#{idx + 1}</span>
            <div className="flex gap-1">
              {/* 모아 보기 중에는 잠근다. 보이는 자리와 저장되는 자리가 달라 결과를 예측할 수 없다. */}
              <button type="button" onClick={() => move(row._key, -1)} disabled={grouped || vi === 0} aria-label="위로 이동" title={grouped ? '모아 보기 중에는 순서를 바꿀 수 없습니다' : undefined} className="px-2 py-1 text-ds-text/70 disabled:opacity-30 hover:opacity-80">↑</button>
              <button type="button" onClick={() => move(row._key, 1)} disabled={grouped || vi === visible.length - 1} aria-label="아래로 이동" title={grouped ? '모아 보기 중에는 순서를 바꿀 수 없습니다' : undefined} className="px-2 py-1 text-ds-text/70 disabled:opacity-30 hover:opacity-80">↓</button>
              <button type="button" onClick={() => removeRow(row._key)} aria-label="행 삭제" className="px-2 py-1 text-[13px] text-red-400/80 hover:text-red-400">삭제</button>
            </div>
          </div>
          {config.columns.map((c) => (
            <label key={c.key} className="flex flex-col gap-1">
              <span className="text-[11px] tracking-[0.1em] text-ds-text/50">{c.label}</span>
              {c.type === 'image' ? (
                <PhotoField kind="characters" id={row.id} value={row[c.key] ?? ''} onChange={(url) => setVal(row._key, c.key, url)} />
              ) : c.type === 'textarea' ? (
                <>
                  <textarea
                    value={row[c.key] ?? ''}
                    onChange={(e) => setVal(row._key, c.key, e.target.value)}
                    rows={c.markdown ? 6 : 2}
                    placeholder={c.markdown ? '마크다운 지원 (예: - 항목)' : undefined}
                    className={`px-3 py-2 bg-ds-bg border border-ds-key2/25 rounded-sm text-ds-text text-sm outline-none focus:border-ds-key2/60 resize-y`}
                  />
                  {c.markdown && <span className="text-[11px] text-ds-text/35">마크다운 지원 · 불릿(- ), 굵게(**텍스트**)</span>}
                </>
              ) : c.type === 'select' ? (
                <select value={row[c.key] ?? ''} onChange={(e) => setVal(row._key, c.key, e.target.value)} className="min-h-[40px] px-3 bg-ds-bg border border-ds-key2/25 rounded-sm text-ds-text text-sm outline-none focus:border-ds-key2/60">
                  {c.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={row[c.key] ?? ''} onChange={(e) => setVal(row._key, c.key, e.target.value)} className="min-h-[40px] px-3 bg-ds-bg border border-ds-key2/25 rounded-sm text-ds-text text-sm outline-none focus:border-ds-key2/60" />
              )}
            </label>
          ))}
        </div>
        );
      })}
      <ListPager page={result.page} pages={result.pages} onChange={(page) => setView((v) => ({ ...v, page }))} />
      <button type="button" onClick={addRow} className="min-h-[44px] border border-dashed border-ds-key2/40 text-ds-key2 text-sm rounded-sm hover:bg-ds-key2/[0.08]">+ 행 추가</button>
      <div className="flex items-center gap-4 sticky bottom-0 bg-ds-bg/90 backdrop-blur py-4">
        <button type="submit" disabled={pending} className="min-h-[48px] px-6 bg-ds-key2 text-ds-key1 font-medium rounded-sm hover:opacity-90 transition-colors disabled:opacity-60">
          {pending ? '저장 중…' : '저장'}
        </button>
        {state.message && <span className={`text-sm ${state.ok ? 'text-ds-key2' : 'text-red-400'}`}>{state.message}</span>}
      </div>
      </div>

      <ListPreview config={config} rows={payload} site={site} />
    </form>
  );
}

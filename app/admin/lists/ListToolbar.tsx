'use client';
import type { ViewState } from '@/lib/adminView';

/**
 * 목록 편집기 위에 붙는 검색·필터·페이지 줄.
 *
 * 무엇을 그릴지만 고른다. 저장은 화면과 무관하게 전체를 보내므로,
 * 여기서 걸러낸 행이 저장에서 빠지지 않는다 — 그 사실을 화면에도 적어 둔다.
 * 관리자가 "안 보이니까 지워졌나?" 하고 불안해할 자리이기 때문이다.
 */
export function ListToolbar({
  view,
  onChange,
  total,
  matched,
  pages,
  facetLabel,
  facetOptions,
  sortLabel,
  sortOn,
  onToggleSort,
}: {
  view: ViewState;
  onChange: (next: Partial<ViewState>) => void;
  total: number;
  matched: number;
  pages: number;
  facetLabel?: string;
  facetOptions?: { value: string; label: string }[];
  /** 보기 전용 정렬 단추. 안 주면 안 그린다. */
  sortLabel?: string;
  sortOn?: boolean;
  onToggleSort?: () => void;
}) {
  const filtering = view.query !== '' || view.facet !== '';
  const field =
    'min-h-[36px] rounded-sm border border-ds-key2/25 bg-ds-bg px-3 text-[13px] text-ds-text outline-none focus:border-ds-key2/60';

  return (
    <div className="flex flex-col gap-2 border border-ds-key2/15 bg-ds-panel/60 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex-1 min-w-[160px]">
          <span className="sr-only">목록에서 찾기</span>
          <input
            type="search"
            value={view.query}
            onChange={(e) => onChange({ query: e.target.value, page: 1 })}
            placeholder="찾기 (이름 · 내용)"
            className={`w-full ${field}`}
          />
        </label>

        {facetOptions && facetOptions.length > 0 && (
          <label>
            {/* 각 행에도 같은 이름의 셀렉트가 있다. "거르기"를 붙여 구분한다 —
                소리로 듣는 사람에게 "이 행의 상태"와 "상태로 거르기"는 다른 것이다. */}
            <span className="sr-only">{facetLabel ?? '분류'}로 거르기</span>
            <select
              value={view.facet}
              onChange={(e) => onChange({ facet: e.target.value, page: 1 })}
              className={field}
            >
              <option value="">{facetLabel ?? '분류'} 전체</option>
              {facetOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {onToggleSort && (
          <button
            type="button"
            onClick={onToggleSort}
            aria-pressed={sortOn}
            className={`min-h-[36px] cursor-pointer rounded-sm border px-3 text-[12px] transition-colors ${
              sortOn
                ? 'border-ds-key2 bg-ds-key2/10 text-ds-key2'
                : 'border-ds-key2/30 text-ds-text/70 hover:border-ds-key2/60'
            }`}
          >
            {sortLabel ?? '정렬'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-ds-text/55">
        <span>
          {filtering ? `${total}개 중 ${matched}개 보임` : `${total}개`}
          {/* 걸러낸 행도 저장에 그대로 들어간다는 것을 밝힌다. */}
          {filtering && <span className="ml-2 text-ds-text/40">· 저장하면 안 보이는 것까지 함께 저장됩니다</span>}
        </span>

        {pages > 1 && (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ page: view.page - 1 })}
              disabled={view.page <= 1}
              className="cursor-pointer px-2 text-ds-key2 disabled:cursor-default disabled:text-ds-text/25"
            >
              이전
            </button>
            <span className="text-ds-text/70">
              {view.page} / {pages}
            </span>
            <button
              type="button"
              onClick={() => onChange({ page: view.page + 1 })}
              disabled={view.page >= pages}
              className="cursor-pointer px-2 text-ds-key2 disabled:cursor-default disabled:text-ds-text/25"
            >
              다음
            </button>
          </span>
        )}
      </div>

      {sortOn && (
        <p className="text-[12px] leading-[1.7] text-ds-key2/80">
          보기 순서만 바꾼 것입니다. 저장되는 순서는 그대로이고, 이 동안에는 ↑↓ 로 자리를 옮길 수 없습니다.
        </p>
      )}
    </div>
  );
}

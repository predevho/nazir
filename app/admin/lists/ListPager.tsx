'use client';

/**
 * 목록 아래에 붙는 쪽 번호.
 *
 * 위쪽 툴바에도 `이전 / 1 / 2 / 다음`이 있지만, 행을 다 훑고 내려온 자리에서
 * 다시 위로 올라가야 다음 장으로 넘어갈 수 있으면 번거롭다. 아래에는 번호를 눌러
 * 바로 건너뛸 수 있게 둔다.
 *
 * 쪽이 하나뿐이면 그리지 않는다.
 */
export function ListPager({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  const base = 'min-h-[32px] min-w-[32px] cursor-pointer rounded-sm border px-2 text-[12px] transition-colors';

  return (
    <nav aria-label="목록 쪽 이동" className="flex flex-wrap items-center justify-center gap-1.5 py-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={`${base} border-ds-key2/30 text-ds-key2 hover:border-ds-key2/60 disabled:cursor-default disabled:border-ds-text/10 disabled:text-ds-text/25`}
      >
        이전
      </button>

      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          aria-label={`${n}쪽`}
          className={`${base} ${
            n === page
              ? 'border-ds-key2 bg-ds-key2/15 text-ds-key2'
              : 'border-ds-key2/20 text-ds-text/60 hover:border-ds-key2/50 hover:text-ds-text'
          }`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className={`${base} border-ds-key2/30 text-ds-key2 hover:border-ds-key2/60 disabled:cursor-default disabled:border-ds-text/10 disabled:text-ds-text/25`}
      >
        다음
      </button>
    </nav>
  );
}

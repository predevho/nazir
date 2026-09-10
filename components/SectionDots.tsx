import Link from 'next/link';

export type DotItem = { slug: string; no: string; title: string };

/**
 * 시안 하단 페이지네이션 도트. `Frame 36` 기준으로 지름 18px, gap 60px.
 * 〈나지르〉에 대하여(4개)·제작 과정(2개)·후원과 기도(2개)가 같은 규격을 쓴다.
 *
 * 시안에서는 어느 페이지를 보든 1번 도트가 활성으로 그려져 있으나 명백한 실수라
 * 코드에서는 현재 페이지를 활성으로 표시한다.
 *
 * 도트가 서브페이지 이동 수단이라 링크로 만든다(요구사항 명세서 10~11행).
 */
export function SectionDots({
  items,
  activeSlug,
  basePath,
  label,
}: {
  items: DotItem[];
  activeSlug: string;
  basePath: string;
  label: string;
}) {
  return (
    <nav aria-label={`${label} 세부 페이지`}>
      <ul className="flex items-center gap-[60px]">
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <li key={item.slug}>
              <Link
                href={`${basePath}/${item.slug}`}
                aria-current={active ? 'page' : undefined}
                aria-label={`${item.no} ${item.title}`}
                className={`block h-[18px] w-[18px] rounded-full transition-colors ${
                  active ? 'bg-ds-key2' : 'bg-ds-text/25 hover:bg-ds-text/50'
                }`}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

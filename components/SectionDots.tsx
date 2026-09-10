import Link from 'next/link';
import { getNeighbors, type SectionItem } from '../lib/sectionNav';

/**
 * 시안 하단 페이지네이션 도트. `Frame 36` 기준으로 지름 18px, gap 60px.
 * 〈나지르〉에 대하여(4개)·제작 과정(2개)·후원과 기도(2개)가 같은 규격을 쓴다.
 *
 * 도트 좌우의 화살표는 요구사항 명세서 9행("좌우 버튼 또는 슬라이드 동작을 통해
 * 이전·다음 세부 페이지로 이동")에 해당한다. 시안에는 없지만 도트만으로는
 * 다음 장이 어느 쪽인지 알기 어렵다.
 *
 * 시안에서는 어느 페이지를 보든 1번 도트가 활성으로 그려져 있으나 명백한 실수라
 * 코드에서는 현재 페이지를 활성으로 표시한다.
 */
export function SectionDots({
  items,
  activeSlug,
  basePath,
  label,
}: {
  items: SectionItem[];
  activeSlug: string;
  basePath: string;
  label: string;
}) {
  const { prev, next } = getNeighbors(items, activeSlug, basePath);

  const arrow =
    'tap-target flex h-[18px] w-[18px] items-center justify-center font-heir text-[22px] leading-none transition-colors';

  return (
    // gap-7(28px)이면 화살표와 첫 도트의 터치 범위(각 44px)가 겹치지 않는다.
    // 도트 사이 간격은 시안값 60px 그대로다 — 화살표는 시안에 없는 추가 요소라 여기만 조정한다.
    <nav aria-label={`${label} 세부 페이지`} className="flex items-center gap-7">
      {prev ? (
        <Link href={prev.href} aria-label={`이전: ${prev.label}`} className={`${arrow} text-ds-text hover:text-ds-key2`}>
          ‹
        </Link>
      ) : (
        <span aria-hidden className={`${arrow} text-ds-text/20`}>
          ‹
        </span>
      )}

      {/*
        시안 간격은 60px이지만 그건 1920 폭 기준이다. 390에서는 도트 4개(72) +
        간격 3개(180) + 화살표 2개(36) + 그 여백(56) = 344px 로 콘텐츠 폭 327을 넘는다.
        body 의 overflow-x-hidden 이 가려줄 뿐 끝 도트가 잘린다.
        모바일만 32px로 좁힌다 — 중심 간 50px이라 44px 터치 범위도 겹치지 않는다.
      */}
      <ul className="flex items-center gap-8 sm:gap-[60px]">
        {items.map((item) => {
          const active = item.slug === activeSlug;
          return (
            <li key={item.slug}>
              <Link
                href={`${basePath}/${item.slug}`}
                aria-current={active ? 'page' : undefined}
                aria-label={`${item.no} ${item.title}`}
                className={`tap-target block h-[18px] w-[18px] rounded-full transition-colors ${
                  active ? 'bg-ds-key2' : 'bg-ds-text/25 hover:bg-ds-text/50'
                }`}
              />
            </li>
          );
        })}
      </ul>

      {next ? (
        <Link href={next.href} aria-label={`다음: ${next.label}`} className={`${arrow} text-ds-text hover:text-ds-key2`}>
          ›
        </Link>
      ) : (
        <span aria-hidden className={`${arrow} text-ds-text/20`}>
          ›
        </span>
      )}
    </nav>
  );
}

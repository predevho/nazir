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

  /**
   * 화살표는 시안에 없다. 명세 9행 때문에 더한 것이라 도트의 조형(원형)을 따르되,
   * 키컬러 노랑으로 칠해 회색 도트와 확실히 구분한다.
   *
   * 폭에 따라 이 줄에 있을지, 화면 좌우 끝(SectionEdgeNav)에 있을지가 갈린다.
   *   ~767  없음. 스와이프와 코치마크가 대신한다. 좁은 화면에 버튼까지 두면 번잡하다.
   *   768~1535  여기. 화면 끝에 두면 콘텐츠 폭 1398 때문에 본문 카드를 최대 36px 덮는다.
   *   1536~  화면 좌우 끝. 그 폭부터 본문 바깥에 버튼이 들어갈 여백이 생긴다.
   *
   * 끝 페이지에서도 비활성 상태를 지운 자리에 남겨 둔다. 사라지면 도트 줄이 옆으로
   * 밀려 어느 쪽으로 가는 중인지 알기 어려워진다.
   */
  const arrow =
    'tap-target hidden h-9 w-9 items-center justify-center rounded-full border font-heir text-[20px] leading-none transition-colors md:flex 2xl:hidden';
  const arrowOn = `${arrow} border-ds-key2/50 text-ds-key2 hover:border-ds-key2 hover:bg-ds-key2 hover:text-ds-key1`;
  const arrowOff = `${arrow} border-ds-text/10 text-ds-text/20`;

  return (
    // 모바일에서는 가운데로 모은다. 화살표가 빠지면서 도트 4개가 168px 만 쓰는데
    // 왼쪽에 붙여 두면 오른쪽에 174px 이 비어 한쪽으로 쏠려 보인다.
    // md 이상은 왼쪽 정렬 그대로다 — 시안이 도트를 좌측 제목 블록 아래에 두었다.
    //
    // 도트 사이 간격은 시안값 60px 그대로다. 화살표는 시안에 없는 추가 요소라 거기만 조정했다.
    <nav
      aria-label={`${label} 세부 페이지`}
      className="flex items-center justify-center gap-7 md:justify-start"
    >
      {prev ? (
        <Link href={prev.href} aria-label={`이전: ${prev.label}`} className={arrowOn}>
          ‹
        </Link>
      ) : (
        <span aria-hidden className={arrowOff}>
          ‹
        </span>
      )}

      {/*
        시안 간격은 60px이지만 그건 1920 폭 기준이다. 390에서는 도트 4개(72) +
        간격 3개(180) = 252px 로 콘텐츠 폭 342 안에 겨우 들어가고, 터치 범위 44px끼리
        서로 겹친다. 모바일만 32px로 좁힌다 — 중심 간 50px이라 겹치지 않는다.
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
        <Link href={next.href} aria-label={`다음: ${next.label}`} className={arrowOn}>
          ›
        </Link>
      ) : (
        <span aria-hidden className={arrowOff}>
          ›
        </span>
      )}
    </nav>
  );
}

export type SectionItem = { slug: string; no: string; title: string };

export type Neighbors = {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
};

/**
 * 세부 페이지의 이전/다음을 구한다. 하단 도트의 화살표와 스와이프 제스처가
 * 같은 결과를 써야 해서 한곳에 둔다.
 */
export function getNeighbors(
  items: SectionItem[],
  activeSlug: string,
  basePath: string,
): Neighbors {
  const i = items.findIndex((item) => item.slug === activeSlug);
  if (i < 0) return {};
  const at = (n: number) =>
    items[n] ? { href: `${basePath}/${items[n].slug}`, label: `${items[n].no} ${items[n].title}` } : undefined;
  return { prev: i > 0 ? at(i - 1) : undefined, next: i < items.length - 1 ? at(i + 1) : undefined };
}

/** 스와이프로 볼지 판단할 최소 가로 이동 거리(px). */
export const SWIPE_MIN_DISTANCE = 60;

/**
 * 세로 스크롤을 가로채지 않도록, 가로 이동이 세로보다 이만큼 커야 스와이프로 본다.
 * 손가락으로 위아래로 훑을 때 좌우로 조금 흔들리는 것을 걸러낸다.
 */
export const SWIPE_RATIO = 1.5;

export type SwipeResult = 'prev' | 'next' | null;

/** 터치 시작점과 끝점으로 스와이프 방향을 판정한다. 애매하면 null. */
export function readSwipe(dx: number, dy: number): SwipeResult {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE) return null;
  if (Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return null;
  // 왼쪽으로 밀면 다음 장. 종이를 넘기는 방향과 같다.
  return dx < 0 ? 'next' : 'prev';
}

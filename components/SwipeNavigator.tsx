'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { readSwipe, type Neighbors } from '../lib/sectionNav';

/**
 * 손가락으로 좌우로 밀어 이전·다음 세부 페이지로 넘긴다
 * (요구사항 명세서 8행 "좌우 슬라이드 방식으로 이동").
 *
 * 도트와 화살표가 있는 상태에서 얹는 보조 수단이다. 스와이프만으로 접근해야 하는
 * 기능은 없으므로 마우스·키보드 사용자에게 잃는 것이 없다.
 *
 * 세로 스크롤을 가로채지 않으려고 가로 이동이 세로보다 확실히 클 때만 반응한다.
 * 편지 캐러셀처럼 자체 스와이프가 있는 영역은 `data-swipe-ignore` 로 빠진다.
 */
export function SwipeNavigator({
  neighbors,
  children,
}: {
  neighbors: Neighbors;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest?.('[data-swipe-ignore]')) {
      start.current = null;
      return;
    }
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const from = start.current;
    start.current = null;
    if (!from) return;
    const t = e.changedTouches[0];
    const dir = readSwipe(t.clientX - from.x, t.clientY - from.y);
    if (dir === 'next' && neighbors.next) router.push(neighbors.next.href);
    if (dir === 'prev' && neighbors.prev) router.push(neighbors.prev.href);
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
    </div>
  );
}

'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { readSwipe, type Neighbors } from '@/lib/sectionNav';
import { SwipeHint, hintAlreadySeen, markHintSeen } from './SwipeHint';

/**
 * 손가락으로 좌우로 밀어 이전·다음 세부 페이지로 넘긴다
 * (요구사항 명세서 8행 "좌우 슬라이드 방식으로 이동").
 *
 * 미는 동안 본문이 손가락을 따라오고, 놓으면 마저 밀려 나가거나 제자리로 돌아온다.
 * 새 페이지는 반대쪽에서 밀려 들어온다 — 넘긴 방향은 모듈 변수로 다음 화면에 전한다.
 * 클라이언트 이동이라 모듈이 살아 있어서 넘어간다.
 *
 * 도트와 화살표가 있는 상태에서 얹는 보조 수단이다. 스와이프만으로 접근해야 하는
 * 기능은 없으므로 마우스·키보드 사용자에게 잃는 것이 없다.
 *
 * 세로 스크롤을 가로채지 않으려고, 첫 몇 px 으로 가로·세로 중 어느 쪽 제스처인지
 * 먼저 정하고 가로일 때만 따라간다. 편지 캐러셀처럼 자체 스와이프가 있는 영역은
 * `data-swipe-ignore` 로 빠진다.
 */

/** 방금 넘긴 방향. 다음 화면이 어느 쪽에서 들어와야 하는지 알려준다. */
let cameFrom: 'prev' | 'next' | null = null;

const DRAG_START_PX = 8;
const ENTER_MS = 260;
const SETTLE_MS = 200;
const EASE = 'cubic-bezier(.22,.61,.36,1)';

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function SwipeNavigator({
  neighbors,
  children,
}: {
  neighbors: Neighbors;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<'undecided' | 'x' | 'y'>('undecided');
  const [hint, setHint] = useState(false);

  /** 들어올 때 반대쪽에서 밀려 들어온다. */
  useEffect(() => {
    const node = box.current;
    const from = cameFrom;
    cameFrom = null;
    if (!node || !from || prefersReducedMotion()) return;
    node.animate?.(
      [
        { transform: `translateX(${from === 'next' ? 100 : -100}%)`, opacity: 0.5 },
        { transform: 'translateX(0)', opacity: 1 },
      ],
      { duration: ENTER_MS, easing: EASE },
    );
  }, [pathname]);

  /** 처음 온 손가락 기기에만 코치마크를 띄운다. */
  useEffect(() => {
    if (!neighbors.next) return;
    if (typeof matchMedia !== 'function' || !matchMedia('(pointer: coarse)').matches) return;
    if (hintAlreadySeen()) return;
    setHint(true);
    const timer = setTimeout(dismissHint, 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [neighbors.next]);

  function dismissHint() {
    setHint(false);
    markHintSeen();
  }

  function shift(px: number) {
    if (box.current) box.current.style.transform = px ? `translateX(${px}px)` : '';
  }

  function onTouchStart(e: React.TouchEvent) {
    if ((e.target as HTMLElement).closest?.('[data-swipe-ignore]')) {
      start.current = null;
      return;
    }
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
    axis.current = 'undecided';
  }

  function onTouchMove(e: React.TouchEvent) {
    const from = start.current;
    if (!from) return;
    const t = e.touches[0];
    const dx = t.clientX - from.x;
    const dy = t.clientY - from.y;

    if (axis.current === 'undecided') {
      if (Math.abs(dx) < DRAG_START_PX && Math.abs(dy) < DRAG_START_PX) return;
      // 세로가 조금이라도 우세하면 스크롤에 양보한다. 한번 정하면 이 제스처 동안 바뀌지 않는다.
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis.current === 'x' && hint) dismissHint();
    }
    if (axis.current !== 'x') return;

    // 넘어갈 곳이 없는 쪽으로 밀면 저항을 준다 — 끝이라는 것이 손끝으로 전해진다.
    const hasTarget = dx < 0 ? neighbors.next : neighbors.prev;
    shift(hasTarget ? dx : dx * 0.25);
  }

  function onTouchEnd(e: React.TouchEvent) {
    const from = start.current;
    start.current = null;
    const wasHorizontal = axis.current === 'x';
    axis.current = 'undecided';
    if (!from || !wasHorizontal) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - from.x;
    const dir = readSwipe(dx, t.clientY - from.y);
    const target = dir === 'next' ? neighbors.next : dir === 'prev' ? neighbors.prev : undefined;
    const node = box.current;

    if (!target || !dir) {
      // 제자리로 되돌린다.
      shift(0);
      node?.animate?.([{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }], {
        duration: SETTLE_MS,
        easing: EASE,
      });
      return;
    }

    cameFrom = dir;
    shift(0);
    if (node && !prefersReducedMotion()) {
      const out = dir === 'next' ? -node.offsetWidth : node.offsetWidth;
      node.animate?.(
        [
          { transform: `translateX(${dx}px)`, opacity: 1 },
          { transform: `translateX(${out}px)`, opacity: 0.5 },
        ],
        { duration: SETTLE_MS, easing: 'ease-out' },
      );
    }
    router.push(target.href);
  }

  return (
    <div ref={box} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {children}
      <SwipeHint visible={hint} onDismiss={dismissHint} />
    </div>
  );
}

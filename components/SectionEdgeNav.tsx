'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Neighbors } from '../lib/sectionNav';

/**
 * 화면 좌우 끝에 붙는 이전·다음 버튼. 인스타그램 캐러셀과 같은 자리다.
 *
 * 하단 도트(SectionDots)와 역할이 겹치지만 쓰임이 다르다. 도트는 "지금 몇 번째인지"를
 * 보여주고, 이쪽은 스크롤 어디에 있든 손이 닿는 자리에서 장을 넘긴다.
 *
 * 모바일에서는 내보내지 않는다. 390 화면에서 가장자리에 44px 원판을 띄우면 본문
 * 좌우를 덮고, 그 폭에서는 이미 스와이프(SwipeNavigator)가 같은 일을 한다.
 *
 * 푸터가 보이기 시작하면 숨긴다. 페이지 끝까지 내려온 사람은 다음 장을 찾는 게 아니라
 * 연락처나 후원 링크를 보는 중인데, 고정 버튼이 그 위를 덮고 있으면 방해만 된다.
 */
export function SectionEdgeNav({ neighbors }: { neighbors: Neighbors }) {
  const { prev, next } = neighbors;
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    // 푸터 윗변이 화면 아래 20% 안으로 들어오면 숨긴다.
    const io = new IntersectionObserver(([entry]) => setAtFooter(entry.isIntersecting), {
      rootMargin: '0px 0px -20% 0px',
    });
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  if (!prev && !next) return null;

  const edge =
    'tap-target pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-ds-text/20 bg-ds-bg/70 font-heir text-[22px] leading-none text-ds-text backdrop-blur-sm transition-colors hover:border-ds-key2 hover:text-ds-key2';

  return (
    <div
      aria-hidden={atFooter}
      className={`pointer-events-none fixed inset-y-0 left-0 right-0 z-40 hidden items-center justify-between px-4 transition-opacity duration-200 md:flex ${
        atFooter ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 첫 장·끝 장에서는 빈 자리를 남겨 반대쪽 버튼이 제자리에 머물게 한다. */}
      {prev ? (
        <Link href={prev.href} aria-label={`이전: ${prev.label}`} className={edge}>
          ‹
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} aria-label={`다음: ${next.label}`} className={edge}>
          ›
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}

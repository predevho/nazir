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
    'tap-target pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-ds-key2/50 bg-ds-bg/70 font-heir text-[22px] leading-none text-ds-key2 backdrop-blur-sm transition-colors hover:border-ds-key2 hover:bg-ds-key2 hover:text-ds-key1';

  return (
    <div
      aria-hidden={atFooter}
      /*
        1536 이상에서만 내보낸다. 콘텐츠 폭이 1398 이라 그 아래에서는 화면 끝에 버튼을
        두면 본문 카드를 덮는다 — 768·1024 에서 36px, 1280 에서 28px 이 겹쳤다.
        그 폭대에서는 도트 줄 안의 화살표(SectionDots)가 대신한다.

        좌우 여백은 본문 바깥 여백에서 20px 을 뺀 값이다. 콘텐츠 상자(1398)의 바깥
        여백이 (100vw-1398)/2 이고 상자 안쪽 패딩이 32px 이므로, 이렇게 두면 버튼
        오른쪽 끝과 본문 시작 사이에 8px 이 남는다. 1536 에서도, 1920 에서도 같다.
      */
      className={`pointer-events-none fixed inset-y-0 left-0 right-0 z-40 hidden items-center justify-between px-[calc((100vw-1398px)/2-1.25rem)] transition-opacity duration-200 2xl:flex ${
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

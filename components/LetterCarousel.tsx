'use client';
import { useRef, useState } from 'react';
import type { AboutLetter } from '../content/types';
import { readSwipe } from '../lib/sectionNav';

/**
 * 시안 `Frame 35`: 편지 이미지 634×846, 아래에 `‹ 1 / N ›` 페이저.
 * 연출의 인사말·Praysound 소개는 텍스트가 아니라 이미지로 넘겨 보는 구조다
 * (요구사항 명세서 14~16행 "이미지 형태로 표시", 18~19행 "좌우 슬라이드").
 *
 * 장수는 고정이 아니라 등록된 이미지 개수다. 시안의 `1 / 5`는 디자이너가
 * "몇 장이 될지 미지수라 일단 적어둔" 값이고, 운영진이 관리자 페이지에서
 * 넣고 빼는 만큼 페이저가 따라간다.
 *
 * ⚠️ 이미지가 본문을 대신하므로 검색·복사·스크린리더가 닿지 않는다.
 * 좌측 컬럼의 본문 텍스트가 그 대체 수단이고, 각 이미지에는 caption을 alt로 넣는다
 * — docs/figma-spec-review.md 6-2.
 */
export function LetterCarousel({ letters, label }: { letters: AboutLetter[]; label: string }) {
  const [index, setIndex] = useState(0);
  const slides = letters.filter((l) => l.imageUrl);

  if (slides.length === 0) {
    return (
      <div className="flex aspect-[634/846] w-full items-center justify-center border border-ds-key2/25 bg-ds-panel px-6 text-center">
        <p className="font-heir text-[15px] leading-[2] text-ds-text/50">
          {label} 이미지가 아직 등록되지 않았습니다.
          <br />
          관리자 페이지에서 추가할 수 있습니다.
        </p>
      </div>
    );
  }

  const total = slides.length;
  const current = slides[Math.min(index, total - 1)];
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  /**
   * 편지 위에서 미는 것은 "다음 장"이지 "다음 페이지"가 아니다.
   * `data-swipe-ignore` 로 페이지 단위 스와이프(SwipeNavigator)를 막고 여기서 직접 넘긴다.
   */
  const start = useRef<{ x: number; y: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    start.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const from = start.current;
    start.current = null;
    if (!from || total <= 1) return;
    const t = e.changedTouches[0];
    const dir = readSwipe(t.clientX - from.x, t.clientY - from.y);
    if (dir === 'next') go(1);
    if (dir === 'prev') go(-1);
  }

  /**
   * 편지 위에 겹쳐 놓는 좌우 버튼. 인스타그램 캐러셀과 같은 자리다.
   * 글리프만 두면 편지의 손글씨에 묻히므로 반투명 원판을 깔아 띄운다.
   * 장수 표기(`1 / N`)는 시안에 있는 요소라 아래에 그대로 남긴다.
   */
  const edge =
    'tap-target absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 font-heir text-[20px] leading-none text-white backdrop-blur-sm transition-colors hover:border-ds-key2 hover:text-ds-key2';

  return (
    <figure className="relative m-0" data-swipe-ignore onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <img
        src={current.imageUrl ?? ''}
        alt={current.caption || `${label} ${index + 1}번째 장`}
        className="aspect-[634/846] w-full rounded-lg object-cover"
      />

      {total > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} aria-label="이전 장" className={`${edge} left-3`}>
            ‹
          </button>
          <button type="button" onClick={() => go(1)} aria-label="다음 장" className={`${edge} right-3`}>
            ›
          </button>
          <figcaption className="mt-4 text-center font-heir text-[15px] text-ds-text">
            <span aria-live="polite">
              {index + 1} / {total}
            </span>
          </figcaption>
        </>
      )}
    </figure>
  );
}

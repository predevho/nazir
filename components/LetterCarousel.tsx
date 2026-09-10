'use client';
import { useState } from 'react';

/**
 * 시안 `Frame 35`: 편지 이미지 634×846, 아래에 `‹ 1 / 5 ›` 페이저.
 * 연출의 인사말·Praysound 소개는 텍스트가 아니라 이미지로 넘겨 보는 구조다
 * (요구사항 명세서 14~16행 "이미지 형태로 표시", 18~19행 "좌우 슬라이드").
 *
 * ⚠️ 이미지가 텍스트를 대신하므로 검색·복사·스크린리더가 닿지 않는다.
 * 좌측 컬럼의 본문 텍스트가 그 대체 수단이고, 각 이미지에는 alt를 반드시 넣는다
 * — docs/figma-spec-review.md 6-2.
 */
export function LetterCarousel({ images, label }: { images: string[]; label: string }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[634/846] w-full items-center justify-center border border-ds-key2/25 bg-ds-panel px-6 text-center">
        <p className="font-heir text-[15px] leading-[2] text-ds-text/50">
          {label} 이미지가 아직 준비되지 않았습니다.
          <br />
          전달받는 대로 이 자리에 들어갑니다.
        </p>
      </div>
    );
  }

  const total = images.length;
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  return (
    <figure className="m-0">
      <img
        src={images[index]}
        alt={`${label} ${index + 1}번째 장`}
        className="aspect-[634/846] w-full object-cover"
      />
      <figcaption className="mt-4 flex items-center justify-center gap-6 font-heir text-[15px] text-ds-text">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="이전 장"
          className="px-2 leading-none transition-colors hover:text-ds-key2"
        >
          ‹
        </button>
        <span aria-live="polite">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="다음 장"
          className="px-2 leading-none transition-colors hover:text-ds-key2"
        >
          ›
        </button>
      </figcaption>
    </figure>
  );
}

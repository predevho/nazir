import Link from 'next/link';
import type { LandingCard } from '../content/landing';

/**
 * 시안 규격: 행 1398×350, gap 12px → 카드 5개 각 270×350.
 * 카드 배경 #CBA610, 테두리 0.5px #DAC32D, 반경 8px,
 * 그림자 X10 Y10 흐림30 #000000 6%.
 * 글자는 전부 가운데 정렬, 색 #2C0F09 — 제목 25px / 부제 12px / 설명 10px.
 *
 * 아이콘 원본은 181×160 ~ 139×122로 크기가 제각각이라(Figma 코멘트 #3 미해결)
 * 고정 박스 + contain으로 흡수한다. 제목이 바로 옆에 있어 아이콘은 장식으로 둔다.
 */
export function LandingCards({ cards }: { cards: LandingCard[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <li key={c.to}>
          <Link
            href={c.to}
            className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border-[0.5px] border-ds-key2 bg-ds-key2-fill px-4 py-6 text-center text-ds-key1 shadow-[10px_10px_30px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-90 lg:aspect-[27/35] lg:py-0"
          >
            <span
              aria-hidden
              className="h-[100px] w-full bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${c.icon})` }}
            />
            <span className="font-heir text-[25px] leading-tight">{c.title}</span>
            <span className="font-heir text-[12px] leading-tight">{c.subtitle}</span>
            {/*
              설명은 시안대로 10px / 불투명도 0.5다. 디자이너도 모바일 변환 때
              이 값이 안 읽혀 0.8로 올렸으므로(docs/mobile-ui.md) 5단계에서 재검토한다.
            */}
            <span className="whitespace-pre-line font-heir text-[10px] leading-[1.7] opacity-50">
              {c.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

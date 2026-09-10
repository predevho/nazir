import Link from 'next/link';
import type { LandingCard } from '../content/landing';

/**
 * 데스크톱 시안: 행 1398×350, gap 12px → 카드 5개 각 270×350.
 * 카드 배경 #CBA610, 테두리 0.5px #DAC32D, 반경 8px,
 * 그림자 X10 Y10 흐림30 #000000 6%. 글자는 전부 가운데 정렬, 색 #2C0F09.
 *
 * 모바일 시안(390): 세로 카드 5열 → **가로형 1열** 342×148로 바꾼다.
 * 아이콘 88×88, 텍스트 폭 210, 여전히 가운데 정렬 — docs/mobile-ui.md.
 * 근거는 코멘트 #30 "휴대폰으로 확인했을 때 너무 길지 않도록".
 *
 * 아이콘 원본은 181×160 ~ 139×122로 크기가 제각각이라(Figma 코멘트 #3 미해결)
 * 고정 박스 + contain으로 흡수한다. 제목이 바로 옆에 있어 아이콘은 장식으로 둔다.
 */
export function LandingCards({ cards }: { cards: LandingCard[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 xl:grid-cols-5">
      {cards.map((c) => (
        <li key={c.to}>
          <Link
            href={c.to}
            className="flex h-full items-center gap-4 rounded-lg border-[0.5px] border-ds-key2 bg-ds-key2-fill px-4 py-6 text-ds-key1 shadow-[10px_10px_30px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-90 xl:aspect-[27/35] xl:flex-col xl:justify-center xl:gap-2 xl:py-0"
          >
            <span
              aria-hidden
              className="h-[88px] w-[88px] shrink-0 bg-contain bg-center bg-no-repeat xl:h-[100px] xl:w-full"
              style={{ backgroundImage: `url(${c.icon})` }}
            />
            <span className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center xl:flex-none xl:gap-2">
              <span className="font-heir text-[22px] leading-tight xl:text-[25px]">{c.title}</span>
              <span className="font-heir text-[12px] leading-tight">{c.subtitle}</span>
              {/*
                설명은 데스크톱 시안이 10px / 불투명도 0.5다. 디자이너가 모바일 변환 때
                이 값이 안 읽혀 0.8로 올렸으므로(docs/mobile-ui.md) 모바일만 올린다.
              */}
              <span className="whitespace-pre-line font-heir text-[11px] leading-[1.7] opacity-80 xl:text-[10px] xl:opacity-50">
                {c.description}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

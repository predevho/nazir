import Link from 'next/link';
import { ABOUT_SECTIONS, type AboutSlug } from '../content/about';

/**
 * 시안 `Frame 36`: 도트 4개, 지름 18px, gap 60px (252 × 18).
 * 시안에서는 어느 페이지를 보든 1번 도트가 활성으로 그려져 있으나 명백한 실수라
 * 코드에서는 현재 페이지를 활성으로 표시한다.
 *
 * 도트는 서브페이지 이동 수단이라 링크로 만든다. 명세 10~11행의 인디케이터에 해당한다.
 */
export function AboutDots({ activeSlug }: { activeSlug: AboutSlug }) {
  return (
    <nav aria-label="〈나지르〉에 대하여 세부 페이지">
      <ul className="flex items-center gap-[60px]">
        {ABOUT_SECTIONS.map((s) => {
          const active = s.slug === activeSlug;
          return (
            <li key={s.slug}>
              <Link
                href={`/about/${s.slug}`}
                aria-current={active ? 'page' : undefined}
                aria-label={`${s.no} ${s.title}`}
                className={`block h-[18px] w-[18px] rounded-full transition-colors ${
                  active ? 'bg-ds-key2' : 'bg-ds-text/25 hover:bg-ds-text/50'
                }`}
              />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

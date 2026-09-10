import Link from 'next/link';
import type { PeopleGroup } from '@/content/types';

/**
 * 시안 탭 바: 925×45, 3등분. 활성은 노랑 + 밑줄, 비활성은 회색.
 * 시안이 프레임 3개로 나뉘어 있어 상태가 아니라 URL(`?tab=`)로 다룬다.
 * 링크라서 공유·뒤로가기·SEO가 그대로 동작한다.
 */
export function PeopleTabs({ groups, activeLabel }: { groups: PeopleGroup[]; activeLabel: string }) {
  return (
    <nav aria-label="구성원 분류" className="mx-auto w-full max-w-[925px]">
      <ul className="grid grid-cols-3">
        {groups.map((g) => {
          const active = g.label === activeLabel;
          return (
            <li key={g.id} className="contents">
              <Link
                href={`/people?tab=${encodeURIComponent(g.label)}`}
                aria-current={active ? 'page' : undefined}
                className={`border-b py-3 text-center font-heir text-[20px] leading-none transition-colors ${
                  active
                    ? 'border-ds-key2 text-ds-key2'
                    : 'border-[#545454] text-[#8B8B8B] hover:text-ds-text'
                }`}
              >
                {g.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

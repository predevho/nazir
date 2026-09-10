import Link from 'next/link';
import type { PeopleMember } from '../content/types';
import { memberRoleLabel } from '../lib/people';

/**
 * 시안 규격: 그리드 1398×708, 열 gap 12px · 행 gap 8px, 카드 270×350
 * (배경 #CBA610, 테두리 0.5px #DAC32D, 반경 8px,
 * 그림자 X10 Y10 흐림30 #000000 6%). 5열 × 2행.
 *
 * 시안 카드 내부는 비어 있어 구성은 Figma 코멘트 #37을 따른다 — 사진 + 역할 + 이름,
 * 클릭하면 개인 페이지(`/people/[id]`). 요구사항 명세서 32~34행에는 상세페이지 항목이
 * 없어 코멘트 #46 답변이 오면 재확인이 필요하다 — docs/figma-spec-review.md 6-3.
 */
export function PeopleGrid({ members }: { members: PeopleMember[] }) {
  if (members.length === 0) {
    return <p className="py-16 text-center font-heir text-[16px] text-ds-text/60">등록된 구성원이 없습니다.</p>;
  }
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
      {members.map((m) => {
        const role = memberRoleLabel(m);
        return (
          <li key={m.id}>
            <Link
              href={`/people/${m.id}`}
              className="group flex aspect-[27/35] flex-col overflow-hidden rounded-lg border-[0.5px] border-ds-key2 bg-ds-key2-fill shadow-[10px_10px_30px_rgba(0,0,0,0.06)] transition-opacity hover:opacity-90"
            >
              <div className="flex flex-[26] items-center justify-center overflow-hidden bg-ds-key1/10">
                {m.photoUrl ? (
                  <img
                    src={m.photoUrl}
                    alt={m.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-heir text-[12px] text-ds-key1/50">사진</span>
                )}
              </div>
              <div className="flex flex-[9] flex-col items-center justify-center gap-1 px-2 text-ds-key1">
                {role && <span className="font-heir text-[12px] leading-none opacity-75">{role}</span>}
                <span className="font-heir text-[18px] leading-none">{m.name}</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

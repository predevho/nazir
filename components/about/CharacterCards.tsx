import type { Character } from '@/content/types';
import { MarkdownText } from '@/components/ui/MarkdownText';

/**
 * 시안 `〈나지르〉에 대하여` 04의 인물 카드.
 *
 * 시안 인물 카드는 이름 + 설명만 있고 사진이 없다. 반면 요구사항 명세서 21행은
 * "이미지 카드 형태"를 요구한다. 사진이 등록된 인물만 사진을 얹어 둘 다 만족시킨다 —
 * 지금은 전원 미등록이라 화면은 시안과 같고, 관리자가 올리면 카드에 나타난다.
 */
export function CharacterCards({ characters }: { characters: Character[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {characters.map((c) => (
        <li key={c.id} className="flex gap-5 border border-ds-key2/40 p-6">
          {c.photoUrl && (
            <img
              src={c.photoUrl}
              alt={c.name}
              loading="lazy"
              className="h-24 w-24 flex-none rounded-sm object-cover"
            />
          )}
          <div className="min-w-0">
            <h2 className="font-heir text-[22px] leading-none text-ds-key2">{c.name}</h2>
            <MarkdownText className="mt-3 font-heir text-[15px] leading-[1.9] text-ds-text/80">
              {c.description}
            </MarkdownText>
          </div>
        </li>
      ))}
    </ul>
  );
}

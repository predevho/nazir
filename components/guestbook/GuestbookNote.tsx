import { formatNoteDate, noteStyle, type GuestbookEntry } from '@/lib/guestbook';

/**
 * 시안 쪽지 카드 (코멘트 #43).
 * - 배경은 찢어진 악보. 정사각형·직사각형을 번갈아 쓴다.
 * - 노란 테이프 `77×36`을 상단에 8° / −8°로 교대해 붙인다.
 * - 좌상단 이름 / 가운데 내용 / 우하단 날짜.
 *
 * 시안의 좌하단 댓글 아이콘은 대댓글용인데, 대댓글은 에셋·정책이 확정되지 않아
 * 아직 넣지 않았다(docs/decisions.md C-2). 눌러도 아무것도 안 되는 아이콘을
 * 두는 것보다 비워두는 편이 낫다.
 */
export function GuestbookNote({ entry, index }: { entry: GuestbookEntry; index: number }) {
  const { background, tapeAngle } = noteStyle(index);

  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute left-1/2 top-[-14px] z-10 block h-[36px] w-[77px] -translate-x-1/2 border-[0.5px] border-ds-key2 bg-[rgba(218,195,45,0.8)]"
        style={{ transform: `translateX(-50%) rotate(${tapeAngle}deg)` }}
      />
      <article
        className="flex min-h-[224px] flex-col justify-between bg-contain bg-center bg-no-repeat px-9 py-7 text-ds-key1"
        style={{ backgroundImage: `url(${background})`, backgroundSize: '100% 100%' }}
      >
        <p className="font-griun text-[15px] leading-none">{entry.name}</p>
        <p className="my-4 whitespace-pre-line break-words text-center font-griun text-[20px] leading-[1.4]">
          {entry.message}
        </p>
        <p className="text-right font-griun text-[15px] leading-none">
          {formatNoteDate(entry.createdAt)}
        </p>
      </article>
    </li>
  );
}

import { formatNoteDate, noteStyle, type GuestbookEntry, type GuestbookReply } from '@/lib/guestbook';

/**
 * 시안 쪽지 카드 (코멘트 #43).
 * - 배경은 찢어진 악보. 정사각형·직사각형을 번갈아 쓴다.
 * - 노란 테이프 `77×36`을 상단에 8° / −8°로 교대해 붙인다.
 * - 좌상단 이름 / 가운데 내용 / 우하단 날짜.
 *
 * 답글은 쪽지 **아래에** 별도 카드로 붙인다(명세 45행).
 *
 * 시안이 정한 방향은 "메모 아이콘을 누르면 이미지 레이어가 늘어나며 표시"였는데,
 * 쪽지 배경이 비트맵(찢어진악보 428×216)이라 세로로 늘리면 악보 오선 간격이
 * 벌어져 눈에 띄게 어색해진다 — docs/decisions.md C-2의 표 참고.
 * 왜곡 없이 늘리려면 9-slice용 3분할 이미지나 답글용 작은 쪽지 이미지가 필요한데
 * 아직 받지 못했다. 그래서 종이 위에 얹지 않고 디자인 토큰으로 된 카드를 아래에 둔다.
 * 에셋이 오면 이 블록의 배경만 바꾸면 된다.
 *
 * 접어 두지 않고 늘 보인다. 답글은 운영진만 달아 수가 적고, 접어 두면 그리드 안에서
 * 펼칠 때 옆 칸까지 밀린다. 명세 45행도 "함께 표시"다.
 */
export function GuestbookNote({
  entry,
  index,
  replies = [],
}: {
  entry: GuestbookEntry;
  index: number;
  replies?: GuestbookReply[];
}) {
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

      {replies.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {replies.map((reply) => (
            <li
              key={reply.id}
              className="rounded-lg border-[0.5px] border-ds-key2/40 bg-ds-panel px-5 py-4"
            >
              <p className="flex items-baseline justify-between gap-3 font-heir text-[13px] leading-none text-ds-key2">
                제작팀
                <span className="text-ds-text/40">{formatNoteDate(reply.createdAt)}</span>
              </p>
              <p className="mt-3 whitespace-pre-line break-words break-keep font-heir text-[14px] leading-[1.9] text-ds-text/80">
                {reply.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

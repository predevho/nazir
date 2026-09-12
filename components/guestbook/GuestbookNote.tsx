'use client';
import { useActionState, useState } from 'react';
import { CommentIcon } from './CommentIcon';
import { HeartIcon } from './HeartIcon';
import type { HeartToggleState } from '@/app/(site)/guestbook/actions';
import { formatNoteDate, noteStyle, type GuestbookEntry, type GuestbookReply } from '@/lib/guestbook';

type HeartAction = (
  prev: HeartToggleState,
  formData: FormData,
) => Promise<HeartToggleState>;

const initialHeartState: HeartToggleState = { ok: false, message: '' };
const noopHeartAction: HeartAction = async () => initialHeartState;

/**
 * 시안 쪽지 카드 (코멘트 #43).
 * - 배경은 찢어진 악보. 정사각형·직사각형을 번갈아 쓴다.
 * - 노란 테이프 `77×36`을 상단에 8° / −8°로 교대해 붙인다.
 * - 좌상단 이름 / 가운데 내용 / 우하단 날짜 / **좌하단 댓글 아이콘·제작팀 하트**.
 *
 * 좌하단 아이콘을 누르면 **같은 종이가 늘어나면서** 답글이 드러난다.
 * 시안이 정한 동작 그대로다 — docs/decisions.md C-2.
 *
 * 하트는 제작팀이 응원에 감사를 표시하려고 켜는 것이다. 방문자 좋아요가 아니고 눌리지도 않는다(C-3).
 *
 * 종이는 배경 이미지가 아니라 `border-image` 로 그린다. 배경으로 늘리면 악보 오선
 * 간격이 벌어지고 찢어진 가장자리가 같이 늘어난다. 9칸으로 잘라 가운데만 반복시키면
 * 높이가 변해도 질감이 그대로다 — 자르는 값은 lib/guestbook.ts 의 noteStyle 에 있다.
 */
export function GuestbookNote({
  entry,
  index,
  replies = [],
  heartAction,
}: {
  entry: GuestbookEntry;
  index: number;
  replies?: GuestbookReply[];
  heartAction?: HeartAction;
}) {
  const { background, slice, border, tapeAngle } = noteStyle(index);
  const [open, setOpen] = useState(false);
  const [, heartFormAction, heartPending] = useActionState(
    heartAction ?? noopHeartAction,
    initialHeartState,
  );
  const panelId = `replies-${entry.id}`;

  return (
    <li className="relative">
      <span
        aria-hidden
        className="absolute left-1/2 top-[-14px] z-10 block h-[36px] w-[77px] -translate-x-1/2 border-[0.5px] border-ds-key2 bg-[rgba(218,195,45,0.8)]"
        style={{ transform: `translateX(-50%) rotate(${tapeAngle}deg)` }}
      />
      <article
        className="flex min-h-[224px] flex-col justify-between px-3 py-1 text-ds-key1"
        style={{
          borderStyle: 'solid',
          borderWidth: border,
          borderImage: `url(${background}) ${slice} fill round`,
        }}
      >
        <p className="font-griun text-[15px] leading-none">{entry.name}</p>
        <p className="my-4 whitespace-pre-line break-words text-center font-griun text-[20px] leading-[1.4]">
          {entry.message}
        </p>

        {/* 늘어난 종이 안에 답글이 이어진다. 접혀 있을 때는 자리도 차지하지 않는다. */}
        {replies.length > 0 && (
          <div id={panelId} hidden={!open}>
            <hr className="mb-4 mt-1 border-0 border-t border-dashed border-ds-key1/30" />
            <ul className="m-0 flex list-none flex-col gap-5 p-0">
              {replies.map((reply) => (
                <li key={reply.id}>
                  <p className="font-griun text-[14px] leading-none opacity-70">
                    제작팀 · {formatNoteDate(reply.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-line break-words break-keep font-griun text-[18px] leading-[1.5]">
                    {reply.message}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          {/*
            왼쪽: 댓글 아이콘 → 제작팀 하트 순.
            댓글 아이콘은 답글이 있는 쪽지에만 붙는다 — 눌러도 아무 일이 없는 아이콘은 없는 것만 못하다.
            하트는 제작팀이 켠 표시일 뿐 눌리지 않는다(docs/decisions.md C-3). 둘 다 없으면 빈 칸.
          */}
          <div className="flex items-center gap-3">
            {replies.length > 0 && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                aria-label={open ? '답글 접기' : `답글 ${replies.length}개 보기`}
                className="tap-target flex items-center gap-1 leading-none transition-opacity hover:opacity-70"
              >
                <CommentIcon className="h-[21px] w-[21px]" />
                {replies.length > 1 && (
                  <span aria-hidden className="font-griun text-[14px] leading-none">
                    {replies.length}
                  </span>
                )}
              </button>
            )}
            {heartAction ? (
              <form action={heartFormAction} className="contents">
                <input type="hidden" name="id" value={entry.id} />
                <input type="hidden" name="op" value={entry.isHearted ? 'unheart' : 'heart'} />
                <button
                  type="submit"
                  disabled={heartPending}
                  aria-label={entry.isHearted ? '하트 거두기' : '하트 보내기'}
                  className="tap-target flex cursor-pointer items-center gap-1 leading-none text-ds-key1 transition-opacity hover:opacity-70 disabled:opacity-40"
                >
                  <span
                    role="img"
                    aria-label="제작팀의 하트"
                    className="flex items-center gap-1 leading-none text-ds-key1"
                  >
                    <HeartIcon className="h-[21px] w-[21px]" />
                    <span aria-hidden className="font-griun text-[14px] leading-none">
                      제작팀
                    </span>
                  </span>
                </button>
              </form>
            ) : entry.isHearted && (
              <span
                role="img"
                aria-label="제작팀의 하트"
                className="flex items-center gap-1 leading-none text-ds-key1"
              >
                <HeartIcon className="h-[21px] w-[21px]" />
                <span aria-hidden className="font-griun text-[14px] leading-none">
                  제작팀
                </span>
              </span>
            )}
          </div>
          <p className="font-griun text-[15px] leading-none">{formatNoteDate(entry.createdAt)}</p>
        </div>
      </article>
    </li>
  );
}

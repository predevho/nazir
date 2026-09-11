'use client';
import { useActionState, useState } from 'react';
import { moderateEntry, saveReply, type ModerateState } from './actions';
import { REPLY_MAX, formatNoteDate, type GuestbookReply } from '@/lib/guestbook';
import { describeHold, type HoldReason } from '@/lib/moderation';

export type AdminEntry = {
  id: string;
  name: string;
  message: string;
  isHeld: boolean;
  /** 제작팀 하트 — docs/decisions.md C-3. */
  isHearted: boolean;
  /** 왜 숨겨졌는지. 비어 있으면 운영진이 손으로 숨긴 글이다. */
  holdReasons: HoldReason[];
  createdAt: string;
  replies: GuestbookReply[];
};

const initial: ModerateState = { ok: false, message: '' };

/**
 * 응원글 검토 화면. 보류된 글이 위로 올라오고, 각 행에서 공개/숨김/삭제를 한다.
 * 삭제는 되돌릴 수 없어 한 번 더 눌러야 실행된다.
 */
export function GuestbookAdmin({ entries }: { entries: AdminEntry[] }) {
  const [state, formAction, pending] = useActionState(moderateEntry, initial);
  const [replyState, replyAction, replyPending] = useActionState(saveReply, initial);
  const [confirming, setConfirming] = useState<string | null>(null);
  // 답글 칸은 눌러야 열린다. 43개 글마다 입력칸이 펼쳐져 있으면 검토 화면이 안 읽힌다.
  const [composing, setComposing] = useState<string | null>(null);

  const held = entries.filter((e) => e.isHeld);

  if (entries.length === 0) {
    return <p className="text-sm text-ds-text/60">아직 등록된 응원글이 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {held.length > 0 && (
        <p className="border border-ds-key2/40 bg-ds-key2/[0.08] px-4 py-3 text-sm text-ds-text">
          검토 대기 {held.length}건 — 규칙에 걸려 자동으로 숨겨진 글입니다.
        </p>
      )}
      {(state.message || replyState.message) && (
        <p
          role="status"
          className={`text-sm ${(state.message ? state.ok : replyState.ok) ? 'text-ds-key2' : 'text-ds-text/70'}`}
        >
          {state.message || replyState.message}
        </p>
      )}

      <ul className="m-0 grid list-none gap-2 p-0">
        {entries.map((e) => (
          <li
            key={e.id}
            className={`border p-4 ${
              e.isHeld ? 'border-ds-key2/40 bg-ds-key2/[0.06]' : 'border-ds-key2/15 bg-ds-panel'
            }`}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-heir text-[15px] text-ds-text">{e.name}</span>
              <span className="text-[11px] text-ds-text/45">
                {formatNoteDate(e.createdAt)}
              </span>
              {e.isHeld && (
                <span className="text-[11px] tracking-[0.14em] text-ds-key2">숨김</span>
              )}
              {e.isHearted && (
                <span className="text-[11px] tracking-[0.14em] text-ds-key2">
                  <span aria-hidden>♥</span> 하트
                </span>
              )}
              {/* 무엇에 걸렸는지 밝힌다. 사유 없이 숨김만 보이면 판단할 근거가 없다. */}
              {e.holdReasons.length > 0 && (
                <span className="border border-ds-key2/40 px-2 py-0.5 text-[11px] text-ds-key2/90">
                  {describeHold(e.holdReasons)}
                </span>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line break-words text-sm font-light leading-[1.9] text-ds-text/80">
              {e.message}
            </p>

            {/*
              폼으로 감싼 버튼과 안 감싼 버튼이 섞여 있다. 폼이 박스를 하나 더 만들어
              정렬 기준이 서로 달라지므로, 폼에 display:contents 를 줘서 버튼이 직접
              flex 항목이 되게 했다. items-center 로 높이도 맞춘다.
            */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <form action={formAction} className="contents">
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="op" value={e.isHeld ? 'release' : 'hold'} />
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer border border-ds-key2/50 px-3 py-1.5 text-[11px] text-ds-key2 transition-colors hover:bg-ds-key2/10 disabled:opacity-40"
                >
                  {e.isHeld ? '공개하기' : '숨기기'}
                </button>
              </form>

              {/* 제작팀 하트. 숨긴 글에도 켤 수 있다 — 숨김을 풀면 바로 보인다. */}
              <form action={formAction} className="contents">
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="op" value={e.isHearted ? 'unheart' : 'heart'} />
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer border border-ds-key2/50 px-3 py-1.5 text-[11px] text-ds-key2 transition-colors hover:bg-ds-key2/10 disabled:opacity-40"
                >
                  {e.isHearted ? '하트 거두기' : '하트 보내기'}
                </button>
              </form>

              {confirming === e.id ? (
                <>
                  <form action={formAction} onSubmit={() => setConfirming(null)} className="contents">
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="op" value="delete" />
                    <button
                      type="submit"
                      disabled={pending}
                      className="cursor-pointer border border-red-400/60 px-3 py-1.5 text-[11px] text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-40"
                    >
                      정말 삭제 (되돌릴 수 없음)
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="cursor-pointer px-3 py-1.5 text-[11px] text-ds-text/50 hover:text-ds-text"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(e.id)}
                  className="cursor-pointer border border-ds-text/25 px-3 py-1.5 text-[11px] text-ds-text/60 transition-colors hover:border-ds-text/50 hover:text-ds-text"
                >
                  삭제
                </button>
              )}
            </div>

            {/* 답글 — 명세 44·47행. 운영진만 쓴다(docs/decisions.md C-2). */}
            <div className="mt-4 border-t border-ds-key2/15 pt-3">
              {e.replies.map((r) => (
                <div key={r.id} className="mb-2 border-l-2 border-ds-key2/40 pl-3">
                  <p className="whitespace-pre-line break-words text-sm leading-[1.9] text-ds-text/80">
                    {r.message}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {/* 날짜는 숫자라 monospace 가 맞고, 한글 라벨은 아니다.
                        monospace 스택에 한글 글리프가 없어 글자마다 다른 폰트로 떨어진다. */}
                    <span className="font-mono text-[11px] leading-none text-ds-text/40">
                      {formatNoteDate(r.createdAt)}
                    </span>
                    {/*
                      두 버튼은 클래스가 같아야 한다. 하나는 폼 안, 하나는 밖이라
                      구조가 어긋나 있었고 크기도 10px/11px 로 갈렸다.
                      폼에 display:contents 를 줘서 둘 다 같은 flex 의 직접 항목이 된다.

                      aria-label 로 "답글"을 붙여 원글의 삭제 버튼과 구분한다 —
                      화면에는 같은 글자가 두 번 나오므로, 소리로 듣는 사람에게는
                      무엇을 지우는 건지 구분이 필요하다.
                    */}
                    <button
                      type="button"
                      onClick={() => setComposing(composing === r.id ? null : r.id)}
                      aria-label={composing === r.id ? '답글 수정 접기' : '답글 수정'}
                      className="cursor-pointer text-[11px] leading-none text-ds-key2 hover:underline"
                    >
                      {composing === r.id ? '접기' : '수정'}
                    </button>
                    <form action={replyAction} className="contents">
                      <input type="hidden" name="op" value="delete" />
                      <input type="hidden" name="replyId" value={r.id} />
                      <button
                        type="submit"
                        disabled={replyPending}
                        aria-label="답글 삭제"
                        className="cursor-pointer text-[11px] leading-none text-ds-text/45 hover:text-red-300 disabled:opacity-40"
                      >
                        삭제
                      </button>
                    </form>
                  </div>
                  {composing === r.id && (
                    <ReplyForm
                      action={replyAction}
                      pending={replyPending}
                      entryId={e.id}
                      replyId={r.id}
                      defaultValue={r.message}
                      onClose={() => setComposing(null)}
                    />
                  )}
                </div>
              ))}

              {composing === e.id ? (
                <ReplyForm
                  action={replyAction}
                  pending={replyPending}
                  entryId={e.id}
                  onClose={() => setComposing(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setComposing(e.id)}
                  className="cursor-pointer text-[11px] text-ds-key2 hover:underline"
                >
                  + 답글 달기
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 새 답글과 수정이 같은 칸을 쓴다. replyId 가 있으면 고치는 중이다. */
function ReplyForm({
  action,
  pending,
  entryId,
  replyId,
  defaultValue = '',
  onClose,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  entryId: string;
  replyId?: string;
  defaultValue?: string;
  onClose: () => void;
}) {
  return (
    <form action={action} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="op" value="save" />
      <input type="hidden" name="entryId" value={entryId} />
      {replyId && <input type="hidden" name="replyId" value={replyId} />}
      <label className="sr-only" htmlFor={`reply-${replyId ?? entryId}`}>
        답글 내용
      </label>
      <textarea
        id={`reply-${replyId ?? entryId}`}
        name="message"
        rows={2}
        maxLength={REPLY_MAX}
        defaultValue={defaultValue}
        autoFocus
        placeholder="응원에 답하는 한 마디"
        className="w-full resize-y border border-ds-key2/30 bg-ds-bg px-3 py-2 text-sm leading-[1.7] text-ds-text outline-none placeholder:text-ds-text/35 focus:border-ds-key2"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer border border-ds-key2/50 px-3 py-1.5 text-[11px] text-ds-key2 transition-colors hover:bg-ds-key2/10 disabled:opacity-40"
        >
          {replyId ? '수정' : '답글 남기기'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer px-3 py-1.5 text-[11px] text-ds-text/50 hover:text-ds-text"
        >
          취소
        </button>
      </div>
    </form>
  );
}

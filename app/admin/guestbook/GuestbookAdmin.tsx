'use client';
import { useActionState, useState } from 'react';
import { moderateEntry, type ModerateState } from './actions';
import { formatNoteDate } from '@/lib/guestbook';

export type AdminEntry = {
  id: string;
  name: string;
  message: string;
  isHeld: boolean;
  createdAt: string;
};

const initial: ModerateState = { ok: false, message: '' };

/**
 * 응원글 검토 화면. 보류된 글이 위로 올라오고, 각 행에서 공개/숨김/삭제를 한다.
 * 삭제는 되돌릴 수 없어 한 번 더 눌러야 실행된다.
 */
export function GuestbookAdmin({ entries }: { entries: AdminEntry[] }) {
  const [state, formAction, pending] = useActionState(moderateEntry, initial);
  const [confirming, setConfirming] = useState<string | null>(null);

  const held = entries.filter((e) => e.isHeld);

  if (entries.length === 0) {
    return <p className="text-sm text-paper/60">아직 등록된 응원글이 없습니다.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {held.length > 0 && (
        <p className="border border-gold/40 bg-gold/[0.08] px-4 py-3 text-sm text-paper">
          검토 대기 {held.length}건 — 링크가 포함되어 자동으로 숨겨진 글입니다.
        </p>
      )}
      {state.message && (
        <p
          role="status"
          className={`text-sm ${state.ok ? 'text-gold' : 'text-paper/70'}`}
        >
          {state.message}
        </p>
      )}

      <ul className="m-0 grid list-none gap-2 p-0">
        {entries.map((e) => (
          <li
            key={e.id}
            className={`border p-4 ${e.isHeld ? 'border-gold/40 bg-velvet-2' : 'border-gold/15 bg-velvet'}`}
          >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-[15px] text-paper">{e.name}</span>
              <span className="font-mono text-[11px] text-paper/45">
                {formatNoteDate(e.createdAt)}
              </span>
              {e.isHeld && (
                <span className="font-mono text-[10px] tracking-[0.14em] text-gold">숨김</span>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line break-words text-sm font-light leading-[1.9] text-paper/80">
              {e.message}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <form action={formAction}>
                <input type="hidden" name="id" value={e.id} />
                <input type="hidden" name="op" value={e.isHeld ? 'release' : 'hold'} />
                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer border border-gold/50 px-3 py-1.5 font-mono text-[11px] text-gold transition-colors hover:bg-gold/10 disabled:opacity-40"
                >
                  {e.isHeld ? '공개하기' : '숨기기'}
                </button>
              </form>

              {confirming === e.id ? (
                <>
                  <form action={formAction} onSubmit={() => setConfirming(null)}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="op" value="delete" />
                    <button
                      type="submit"
                      disabled={pending}
                      className="cursor-pointer border border-red-400/60 px-3 py-1.5 font-mono text-[11px] text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-40"
                    >
                      정말 삭제 (되돌릴 수 없음)
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="cursor-pointer px-3 py-1.5 font-mono text-[11px] text-paper/50 hover:text-paper"
                  >
                    취소
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(e.id)}
                  className="cursor-pointer border border-paper/25 px-3 py-1.5 font-mono text-[11px] text-paper/60 transition-colors hover:border-paper/50 hover:text-paper"
                >
                  삭제
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkReply } from '@/lib/guestbook';

export type ModerateState = { ok: boolean; message: string };

export type ModerateOp = 'hold' | 'release' | 'delete' | 'heart' | 'unheart';

const DONE: Record<ModerateOp, string> = {
  hold: '숨김 처리했습니다. 공개 목록에서 사라집니다.',
  release: '공개했습니다. 게시판에 바로 보입니다.',
  delete: '삭제했습니다.',
  heart: '하트를 보냈습니다. 쪽지에 제작팀 하트가 붙습니다.',
  unheart: '하트를 거뒀습니다.',
};

const OPS = Object.keys(DONE) as ModerateOp[];
const isModerateOp = (v: string): v is ModerateOp => (OPS as string[]).includes(v);

/**
 * 삭제를 뺀 나머지 동작이 바꿀 칸. 삭제는 되돌릴 수 없으므로 "그 밖의 경우"로 두지 않는다 —
 * 나중에 동작을 더하고 여기를 잊으면 `never` 에서 타입 오류가 난다.
 */
function patchFor(op: Exclude<ModerateOp, 'delete'>) {
  switch (op) {
    case 'hold':
    case 'release':
      return { is_held: op === 'hold' };
    case 'heart':
    case 'unheart':
      return { is_hearted: op === 'heart' };
    default: {
      const unreachable: never = op;
      throw new Error(`처리하지 않은 동작: ${String(unreachable)}`);
    }
  }
}

/**
 * 응원글 한 건을 숨김 / 공개 / 삭제하거나 제작팀 하트를 켜고 끈다.
 *
 * 링크가 섞인 글은 등록 시 자동으로 보류(`is_held`)되므로, 운영진이 여기서 보고
 * 풀어주거나 지운다 — docs/decisions.md C-4.
 *
 * 하트는 제작팀이 응원에 감사를 표시하는 boolean 하나다(C-3). 숨긴 글에도 켤 수 있다 —
 * 숨김을 풀면 바로 보이면 되고, 막을 이유가 없다.
 *
 * 작성자 본인이 지우는 경로는 두지 않기로 했다(C-1). 삭제 권한은 여기뿐이다.
 */
export async function moderateEntry(
  _prev: ModerateState,
  formData: FormData,
): Promise<ModerateState> {
  const id = String(formData.get('id') ?? '').trim();
  const op = String(formData.get('op') ?? '');
  if (!id) return { ok: false, message: '대상을 찾지 못했습니다.' };
  if (!isModerateOp(op)) {
    return { ok: false, message: '알 수 없는 동작입니다.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { error } =
    op === 'delete'
      ? await supabase.from('guestbook_entries').delete().eq('id', id)
      : await supabase.from('guestbook_entries').update(patchFor(op)).eq('id', id);

  if (error) return { ok: false, message: `처리 실패: ${error.message}` };

  revalidatePath('/guestbook');
  revalidatePath('/admin/guestbook');
  return { ok: true, message: DONE[op] };
}


export type ReplyOp = 'save' | 'delete';

/**
 * 응원글에 다는 답글을 쓰고, 고치고, 지운다 (명세 44·47행).
 *
 * 답글은 운영진만 단다 — docs/decisions.md C-2. 그래서 공개 작성 경로(RPC)가 없고
 * 이 서버 액션과 RLS 의 `auth all` 정책이 유일한 쓰기 통로다.
 *
 * id 가 있으면 고치고 없으면 새로 만든다. 한 글에 여러 답글이 붙을 수 있어(1:N)
 * "그 글의 답글"이 아니라 "이 답글"을 가리켜야 한다.
 */
export async function saveReply(
  _prev: ModerateState,
  formData: FormData,
): Promise<ModerateState> {
  const op = String(formData.get('op') ?? 'save') as ReplyOp;
  const replyId = String(formData.get('replyId') ?? '').trim();
  const entryId = String(formData.get('entryId') ?? '').trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  if (op === 'delete') {
    if (!replyId) return { ok: false, message: '지울 답글을 찾지 못했습니다.' };
    const { error } = await supabase.from('guestbook_replies').delete().eq('id', replyId);
    if (error) return { ok: false, message: `삭제 실패: ${error.message}` };
    revalidatePath('/guestbook');
    revalidatePath('/admin/guestbook');
    return { ok: true, message: '답글을 지웠습니다.' };
  }

  const checked = checkReply(formData.get('message'));
  if (!checked.ok) {
    return {
      ok: false,
      message: checked.reason === 'empty' ? '답글 내용을 적어 주세요.' : '답글이 너무 깁니다.',
    };
  }

  const { error } = replyId
    ? await supabase
        .from('guestbook_replies')
        .update({ message: checked.message, updated_at: new Date().toISOString() })
        .eq('id', replyId)
    : await supabase.from('guestbook_replies').insert({ entry_id: entryId, message: checked.message });

  if (error) return { ok: false, message: `저장 실패: ${error.message}` };

  revalidatePath('/guestbook');
  revalidatePath('/admin/guestbook');
  return { ok: true, message: replyId ? '답글을 고쳤습니다.' : '답글을 남겼습니다. 게시판에 바로 보입니다.' };
}

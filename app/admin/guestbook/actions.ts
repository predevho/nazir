'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkReply } from '@/lib/guestbook';

export type ModerateState = { ok: boolean; message: string };

export type ModerateOp = 'hold' | 'release' | 'delete';

const DONE: Record<ModerateOp, string> = {
  hold: '숨김 처리했습니다. 공개 목록에서 사라집니다.',
  release: '공개했습니다. 게시판에 바로 보입니다.',
  delete: '삭제했습니다.',
};

/**
 * 응원글 한 건을 숨김 / 공개 / 삭제한다.
 *
 * 링크가 섞인 글은 등록 시 자동으로 보류(`is_held`)되므로, 운영진이 여기서 보고
 * 풀어주거나 지운다 — docs/decisions.md C-4.
 *
 * 작성자 본인이 지우는 경로는 두지 않기로 했다(C-1). 삭제 권한은 여기뿐이다.
 */
export async function moderateEntry(
  _prev: ModerateState,
  formData: FormData,
): Promise<ModerateState> {
  const id = String(formData.get('id') ?? '').trim();
  const op = String(formData.get('op') ?? '') as ModerateOp;
  if (!id) return { ok: false, message: '대상을 찾지 못했습니다.' };
  if (op !== 'hold' && op !== 'release' && op !== 'delete') {
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
      : await supabase
          .from('guestbook_entries')
          .update({ is_held: op === 'hold' })
          .eq('id', id);

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

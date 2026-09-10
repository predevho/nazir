'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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

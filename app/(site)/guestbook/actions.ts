'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ADMIN_EMAIL_DOMAIN } from '@/lib/adminUsername';
import { createClient } from '@/lib/supabase/server';

export type HeartToggleState = { ok: boolean; message: string };
export type HeartToggleOp = 'heart' | 'unheart';

const DONE: Record<HeartToggleOp, string> = {
  heart: '하트를 보냈습니다. 쪽지에 제작팀 하트가 붙습니다.',
  unheart: '하트를 거뒀습니다.',
};

const isHeartToggleOp = (v: string): v is HeartToggleOp => v === 'heart' || v === 'unheart';
const isAdminEmail = (email: string | undefined) =>
  Boolean(email?.toLowerCase().endsWith(`@${ADMIN_EMAIL_DOMAIN}`));

/** 공개 방명록에서 로그인한 운영진이 제작팀 하트만 켜고 끈다. */
export async function toggleGuestbookHeart(
  _prev: HeartToggleState,
  formData: FormData,
): Promise<HeartToggleState> {
  const id = String(formData.get('id') ?? '').trim();
  const op = String(formData.get('op') ?? '');
  if (!id) return { ok: false, message: '대상을 찾지 못했습니다.' };
  if (!isHeartToggleOp(op)) return { ok: false, message: '알 수 없는 동작입니다.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) return redirect('/admin/login');

  const { error } = await supabase
    .from('guestbook_entries')
    .update({ is_hearted: op === 'heart' })
    .eq('id', id);

  if (error) return { ok: false, message: `처리 실패: ${error.message}` };

  revalidatePath('/guestbook');
  revalidatePath('/admin/guestbook');
  return { ok: true, message: DONE[op] };
}

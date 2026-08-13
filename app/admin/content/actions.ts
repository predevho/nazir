'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_FIELDS } from '@/lib/adminFields';

export type SaveState = { ok: boolean; message: string };

export async function saveContent(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const rows = ADMIN_FIELDS.map((f) => ({
    key: f.key,
    value: String(formData.get(f.key) ?? ''),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('content_blocks').upsert(rows);
  if (error) return { ok: false, message: `저장 실패: ${error.message}` };

  revalidatePath('/', 'layout');
  return { ok: true, message: '저장되었습니다. 공개 페이지에 반영됩니다.' };
}

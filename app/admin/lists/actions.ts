'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_LISTS } from '@/lib/adminLists';

export type SaveState = { ok: boolean; message: string };

function makeServerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'srv-' + Math.random().toString(36).slice(2);
}

export async function saveList(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const listKey = String(formData.get('listKey') ?? '');
  const config = ADMIN_LISTS[listKey];
  if (!config) return { ok: false, message: '알 수 없는 목록입니다.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  let parsed: Array<Record<string, string>>;
  try {
    const raw = JSON.parse(String(formData.get('rows') ?? '[]'));
    if (!Array.isArray(raw)) throw new Error('not array');
    parsed = raw;
  } catch {
    return { ok: false, message: '데이터 형식 오류입니다.' };
  }

  const desired = parsed.map((r, i) => {
    const row: Record<string, unknown> = {
      id: r.id && String(r.id).trim() ? String(r.id) : makeServerId(),
      sort_order: i,
    };
    for (const c of config.columns) {
      const v = String(r[c.key] ?? '');
      row[c.key] = c.type === 'image' ? (v || null) : v;
    }
    return row;
  });

  const { error: upErr } = await supabase.from(config.table).upsert(desired);
  if (upErr) return { ok: false, message: `저장 실패: ${upErr.message}` };

  const keep = new Set(desired.map((r) => r.id as string));
  const { data: existing, error: selErr } = await supabase.from(config.table).select('id');
  if (selErr) return { ok: false, message: `조회 실패: ${selErr.message}` };
  const toDelete = (existing ?? []).map((e) => e.id as string).filter((id) => !keep.has(id));
  if (toDelete.length) {
    const { error: delErr } = await supabase.from(config.table).delete().in('id', toDelete);
    if (delErr) return { ok: false, message: `삭제 실패: ${delErr.message}` };
  }

  revalidatePath('/', 'layout');
  return { ok: true, message: '저장되었습니다. 공개 페이지에 반영됩니다.' };
}

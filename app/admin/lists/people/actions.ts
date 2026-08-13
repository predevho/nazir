'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type SaveState = { ok: boolean; message: string };

type InMember = { id?: string; role?: string; name?: string; bio?: string };
type InGroup = { id?: string; label?: string; members?: InMember[] };

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return 'srv-' + Math.random().toString(36).slice(2);
}

export async function savePeople(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  let groups: InGroup[];
  try {
    const raw = JSON.parse(String(formData.get('groups') ?? '[]'));
    if (!Array.isArray(raw)) throw new Error('not array');
    groups = raw;
  } catch {
    return { ok: false, message: '데이터 형식 오류입니다.' };
  }

  const desiredGroups = groups.map((g, gi) => ({
    id: g.id && String(g.id).trim() ? String(g.id) : makeId(),
    label: String(g.label ?? ''),
    sort_order: gi,
  }));
  const desiredMembers: { id: string; group_id: string; role: string; name: string; bio: string; sort_order: number }[] = [];
  groups.forEach((g, gi) => {
    const groupId = desiredGroups[gi].id;
    (g.members ?? []).forEach((m, mi) => {
      desiredMembers.push({
        id: m.id && String(m.id).trim() ? String(m.id) : makeId(),
        group_id: groupId,
        role: String(m.role ?? ''),
        name: String(m.name ?? ''),
        bio: String(m.bio ?? ''),
        sort_order: mi,
      });
    });
  });

  // 그룹 먼저 upsert(멤버 FK), 그다음 멤버 (빈 배열이면 upsert 생략 — 삭제는 아래에서 수행)
  if (desiredGroups.length) {
    const gUp = await supabase.from('people_groups').upsert(desiredGroups);
    if (gUp.error) return { ok: false, message: `그룹 저장 실패: ${gUp.error.message}` };
  }
  if (desiredMembers.length) {
    const mUp = await supabase.from('people_members').upsert(desiredMembers);
    if (mUp.error) return { ok: false, message: `멤버 저장 실패: ${mUp.error.message}` };
  }

  // 누락 멤버 삭제
  const keepM = new Set(desiredMembers.map((m) => m.id));
  const existM = await supabase.from('people_members').select('id');
  if (existM.error) return { ok: false, message: `조회 실패: ${existM.error.message}` };
  const delM = (existM.data ?? []).map((r) => r.id as string).filter((id) => !keepM.has(id));
  if (delM.length) {
    const d = await supabase.from('people_members').delete().in('id', delM);
    if (d.error) return { ok: false, message: `멤버 삭제 실패: ${d.error.message}` };
  }
  // 누락 그룹 삭제(멤버 cascade)
  const keepG = new Set(desiredGroups.map((g) => g.id));
  const existG = await supabase.from('people_groups').select('id');
  if (existG.error) return { ok: false, message: `조회 실패: ${existG.error.message}` };
  const delG = (existG.data ?? []).map((r) => r.id as string).filter((id) => !keepG.has(id));
  if (delG.length) {
    const d = await supabase.from('people_groups').delete().in('id', delG);
    if (d.error) return { ok: false, message: `그룹 삭제 실패: ${d.error.message}` };
  }

  revalidatePath('/', 'layout');
  return { ok: true, message: '저장되었습니다. 공개 페이지에 반영됩니다.' };
}

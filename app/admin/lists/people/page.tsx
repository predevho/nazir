import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PeopleEditor, type InitialGroup } from './PeopleEditor';

export default async function PeopleAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const [{ data: groups }, { data: members }] = await Promise.all([
    supabase.from('people_groups').select('id,label,sort_order').order('sort_order'),
    supabase.from('people_members').select('id,group_id,role,name,bio,photo_url,sort_order').order('sort_order'),
  ]);
  const initialGroups: InitialGroup[] = (groups ?? []).map((g) => ({
    id: g.id,
    label: g.label,
    members: (members ?? [])
      .filter((m) => m.group_id === g.id)
      .map((m) => ({ id: m.id, role: m.role ?? '', name: m.name ?? '', bio: m.bio ?? '', photo_url: m.photo_url ?? null })),
  }));

  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <Link href="/admin" className="font-mono text-[11px] text-gold">← 관리자</Link>
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mt-3 mb-2">참여자 명단</h1>
      <p className="text-sm text-paper/60 mb-8">그룹·개인 추가 · 수정 · 삭제 · 순서변경 · 사진 업로드 후 저장하면 즉시 반영됩니다.</p>
      <PeopleEditor initialGroups={initialGroups} />
    </section>
  );
}

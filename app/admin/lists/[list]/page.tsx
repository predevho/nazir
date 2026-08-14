import { notFound, redirect } from 'next/navigation';
import { AdminNav } from '../../AdminNav';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_LISTS } from '@/lib/adminLists';
import { ListEditor } from '../ListEditor';

export default async function ListAdminPage({ params }: { params: Promise<{ list: string }> }) {
  const { list } = await params;
  const config = ADMIN_LISTS[list];
  if (!config) notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect('/admin/login');

  const { data } = await supabase.from(config.table).select('*').order('sort_order');
  const rows = (data ?? []) as Record<string, string>[];

  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <AdminNav />
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mt-3 mb-2">{config.title}</h1>
      <p className="text-sm text-paper/60 mb-8">행 추가 · 수정 · 삭제 · 순서변경 후 저장하면 즉시 반영됩니다.</p>
      <ListEditor config={config} initialRows={rows} />
    </section>
  );
}

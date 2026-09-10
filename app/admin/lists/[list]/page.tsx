import { notFound, redirect } from 'next/navigation';
import { AdminNav } from '../../AdminNav';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_LISTS } from '@/lib/adminLists';
import { ListEditor } from '../ListEditor';
import { getContent } from '@/lib/content';

export default async function ListAdminPage({ params }: { params: Promise<{ list: string }> }) {
  const { list } = await params;
  const config = ADMIN_LISTS[list];
  if (!config) notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect('/admin/login');

  const { data } = await supabase.from(config.table).select('*').order('sort_order');
  const rows = (data ?? []) as Record<string, string>[];

  // 미리보기 카드에는 이 목록이 갖고 있지 않은 값도 나온다(예산 총액·기도 안내 문구).
  const { site } = await getContent();

  return (
    <section className="max-w-[760px] xl:max-w-[1320px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <AdminNav />
      <h1 className="font-heir font-bold text-[clamp(24px,5vw,32px)] text-ds-text mt-3 mb-2">{config.title}</h1>
      <p className="text-sm text-ds-text/60 mb-8">행 추가 · 수정 · 삭제 · 순서변경 후 저장하면 즉시 반영됩니다.</p>
      <ListEditor
        config={config}
        initialRows={rows}
        site={{ budgetTotal: site.budgetTotal, prayerNote: site.prayerNote }}
      />
    </section>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getContent } from '@/lib/content';
import { ContentEditForm } from './ContentEditForm';

export default async function ContentAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { site } = await getContent();
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(site)) {
    if (typeof v === 'string') values[k] = v;
  }

  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mb-2">단일 문구 편집</h1>
      <p className="text-sm text-paper/60 mb-8">저장하면 공개 페이지에 즉시 반영됩니다.</p>
      <ContentEditForm values={values} />
    </section>
  );
}

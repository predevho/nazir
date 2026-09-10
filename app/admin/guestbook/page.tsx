import { redirect } from 'next/navigation';
import { AdminNav } from '../AdminNav';
import { createClient } from '@/lib/supabase/server';
import { GuestbookAdmin, type AdminEntry } from './GuestbookAdmin';

/** 검토 화면이라 항상 최신 상태를 봐야 한다. */
export const dynamic = 'force-dynamic';

export default async function GuestbookAdminPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect('/admin/login');

  // 로그인 상태라 RLS의 `auth all` 정책이 걸려 숨긴 글까지 보인다.
  const { data, error } = await supabase
    .from('guestbook_entries')
    .select('id,name,message,is_held,created_at')
    .order('created_at', { ascending: false });

  // 숨긴 글(검토 대기)을 위로 올린다.
  const entries: AdminEntry[] = (data ?? [])
    .map((r) => ({
      id: r.id as string,
      name: r.name as string,
      message: r.message as string,
      isHeld: r.is_held as boolean,
      createdAt: r.created_at as string,
    }))
    .sort((a, b) => Number(b.isHeld) - Number(a.isHeld));

  return (
    <section className="mx-auto max-w-[820px] px-5 py-[clamp(32px,6vw,56px)]">
      <AdminNav />
      <h1 className="mb-2 mt-3 font-display text-[clamp(24px,5vw,32px)] font-bold text-paper">
        응원 게시판
      </h1>
      <p className="mb-8 text-sm text-paper/60">
        링크가 포함된 글은 등록 시 자동으로 숨겨집니다. 확인 후 공개하거나 삭제하세요.
      </p>
      {error ? (
        <p className="text-sm text-paper/60">
          목록을 불러오지 못했습니다. 마이그레이션 `0009_guestbook.sql`이 적용됐는지 확인해 주세요.
        </p>
      ) : (
        <GuestbookAdmin entries={entries} />
      )}
    </section>
  );
}

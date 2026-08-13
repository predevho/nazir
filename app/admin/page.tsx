import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { emailToUsername } from '@/lib/adminUsername';
import { ADMIN_LISTS } from '@/lib/adminLists';
import { logout } from './actions';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mb-2">관리자</h1>
      <p className="text-sm text-paper/60 mb-8">로그인됨: {emailToUsername(user.email ?? '')}</p>
      <div className="grid gap-3 mb-10">
        <Link
          href="/admin/content"
          className="border border-gold/25 bg-velvet rounded-sm p-5 hover:border-gold/55 transition-colors"
        >
          <span className="font-display text-lg text-gold">단일 문구 편집</span>
          <p className="text-sm text-paper/60 mt-1">인사말 · 시놉시스 · 공연 날짜 · 계좌 · 링크 등</p>
        </Link>
      </div>
      <div className="border-t border-gold/15 pt-6 mb-10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">목록 편집</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.values(ADMIN_LISTS).map((l) => (
            <Link
              key={l.key}
              href={`/admin/lists/${l.key}`}
              className="border border-gold/25 bg-velvet rounded-sm px-4 py-3 text-sm text-paper hover:border-gold/55 transition-colors"
            >
              {l.title}
            </Link>
          ))}
        </div>
        <Link
          href="/admin/lists/people"
          className="mt-2 block border border-gold/25 bg-velvet rounded-sm px-4 py-3 text-sm text-paper hover:border-gold/55 transition-colors"
        >
          참여자 명단 (그룹 · 개인)
        </Link>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="min-h-[44px] px-5 border border-gold/50 text-gold text-sm font-medium rounded-sm hover:bg-gold/[0.12] transition-colors"
        >
          로그아웃
        </button>
      </form>
    </section>
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { emailToUsername } from '@/lib/adminUsername';
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
        <div className="border border-dashed border-gold/20 rounded-sm p-5 opacity-60">
          <span className="font-display text-lg text-paper/70">목록 편집 (인물 · 일정 · 명단)</span>
          <p className="text-sm text-paper/50 mt-1">다음 단계(3B-2)에서 추가됩니다.</p>
        </div>
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

import { redirect } from 'next/navigation';
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
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(48px,9vw,88px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">ADMIN</p>
      <h1 className="font-display font-bold text-[clamp(26px,6vw,34px)] text-paper mb-2">관리자</h1>
      <p className="text-sm font-light text-paper/60 mb-8">로그인됨: {emailToUsername(user.email ?? '')}</p>
      <div className="border border-gold/20 bg-velvet rounded-sm p-5 mb-8">
        <p className="text-sm font-light text-paper/70">콘텐츠 편집 기능은 다음 단계(3B)에서 추가됩니다.</p>
      </div>
      <form action={logout}>
        <button type="submit" className="min-h-[48px] px-5 border border-gold/50 text-gold text-sm font-medium rounded-sm hover:bg-gold/[0.12] transition-colors">
          로그아웃
        </button>
      </form>
    </section>
  );
}

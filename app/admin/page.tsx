import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { emailToUsername } from '@/lib/adminUsername';
import { ADMIN_LISTS } from '@/lib/adminLists';
import { getVisitStats } from './visitStats';
import { barHeights } from '@/lib/visits';
import { logout } from './actions';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect('/admin/login');
  const username = emailToUsername(String(claimsData.claims.email ?? ''));

  const stats = await getVisitStats();
  const heights = stats ? barHeights(stats.last7, 44) : [];

  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <h1 className="font-display font-bold text-[clamp(24px,5vw,32px)] text-paper mb-2">관리자</h1>
      <p className="text-sm text-paper/60 mb-8">로그인됨: {username}</p>
      {stats ? (
        <div className="mb-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-gold/25 bg-velvet rounded-sm p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">오늘 방문자</span>
              <p className="font-display text-[clamp(28px,6vw,40px)] text-gold mt-1">{stats.today.toLocaleString()}</p>
            </div>
            <div className="border border-gold/25 bg-velvet rounded-sm p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">총 방문자</span>
              <p className="font-display text-[clamp(28px,6vw,40px)] text-gold mt-1">{stats.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 border border-gold/15 bg-velvet/60 rounded-sm p-4">
            <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">최근 7일</span>
            <div className="flex items-end gap-2 h-[52px] mt-2">
              {stats.last7.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-gold/70 rounded-sm" style={{ height: `${heights[i]}px` }} title={`${d.day}: ${d.count}`} />
                  <span className="font-mono text-[9px] text-paper/40">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-paper/50 mb-8">방문자 집계 준비 중입니다.</p>
      )}
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

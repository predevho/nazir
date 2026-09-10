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

  /*
    검토 대기 건수. 보류된 글이 생겨도 알림 경로가 없어서, 운영진이 응원 게시판에
    직접 들어가 보기 전까지는 아무도 모른다. 로그인하면 제일 먼저 보이는 자리에 둔다.
    조회가 실패해도(마이그레이션 전 등) 화면은 그대로 뜨고 배지만 빠진다.
  */
  const { count: heldCount } = await supabase
    .from('guestbook_entries')
    .select('id', { count: 'exact', head: true })
    .eq('is_held', true);

  return (
    <section className="max-w-[760px] mx-auto px-5 py-[clamp(32px,6vw,56px)]">
      <h1 className="font-heir font-bold text-[clamp(24px,5vw,32px)] text-ds-text mb-2">관리자</h1>
      <p className="text-sm text-ds-text/60 mb-8">로그인됨: {username}</p>

      {heldCount ? (
        <Link
          href="/admin/guestbook"
          className="mb-8 flex items-center justify-between gap-4 border border-ds-key2 bg-ds-key2/[0.1] px-5 py-4 transition-colors hover:bg-ds-key2/[0.16]"
        >
          <span className="text-sm text-ds-text">
            <strong className="font-heir text-[20px] text-ds-key2">{heldCount}건</strong>
            <span className="ml-2">의 응원글이 검토를 기다리고 있습니다.</span>
          </span>
          <span className="shrink-0 font-mono text-[11px] text-ds-key2">검토하기 →</span>
        </Link>
      ) : null}
      {stats ? (
        <div className="mb-8">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-ds-key2/25 bg-ds-panel rounded-sm p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-ds-text/45">오늘 방문자</span>
              <p className="font-heir text-[clamp(28px,6vw,40px)] text-ds-key2 mt-1">{stats.today.toLocaleString()}</p>
            </div>
            <div className="border border-ds-key2/25 bg-ds-panel rounded-sm p-5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-ds-text/45">총 방문자</span>
              <p className="font-heir text-[clamp(28px,6vw,40px)] text-ds-key2 mt-1">{stats.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 border border-ds-key2/15 bg-ds-panel/60 rounded-sm p-4">
            <span className="font-mono text-[10px] tracking-[0.18em] text-ds-text/45">최근 7일</span>
            <div className="flex items-end gap-2 h-[52px] mt-2">
              {stats.last7.map((d, i) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-ds-key2/70 rounded-sm" style={{ height: `${heights[i]}px` }} title={`${d.day}: ${d.count}`} />
                  <span className="font-mono text-[9px] text-ds-text/40">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ds-text/50 mb-8">방문자 집계 준비 중입니다.</p>
      )}
      <div className="grid gap-3 mb-10">
        <Link
          href="/admin/content"
          className="border border-ds-key2/25 bg-ds-panel rounded-sm p-5 hover:border-ds-key2/55 transition-colors"
        >
          <span className="font-heir text-lg text-ds-key2">단일 문구 편집</span>
          <p className="text-sm text-ds-text/60 mt-1">인사말 · 시놉시스 · 공연 날짜 · 계좌 · 링크 등</p>
        </Link>
      </div>
      <div className="border-t border-ds-key2/15 pt-6 mb-10">
        <p className="font-mono text-[11px] tracking-[0.2em] text-ds-key2 mb-3">목록 편집</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.values(ADMIN_LISTS).map((l) => (
            <Link
              key={l.key}
              href={`/admin/lists/${l.key}`}
              className="border border-ds-key2/25 bg-ds-panel rounded-sm px-4 py-3 text-sm text-ds-text hover:border-ds-key2/55 transition-colors"
            >
              {l.title}
            </Link>
          ))}
        </div>
        <Link
          href="/admin/lists/people"
          className="mt-2 block border border-ds-key2/25 bg-ds-panel rounded-sm px-4 py-3 text-sm text-ds-text hover:border-ds-key2/55 transition-colors"
        >
          참여자 명단 (그룹 · 개인)
        </Link>
        <Link
          href="/admin/guestbook"
          className="mt-2 block border border-ds-key2/25 bg-ds-panel rounded-sm px-4 py-3 text-sm text-ds-text hover:border-ds-key2/55 transition-colors"
        >
          응원 게시판 (검토 · 삭제)
          {heldCount ? <span className="ml-2 text-ds-key2">· 대기 {heldCount}건</span> : null}
        </Link>
      </div>
      <form action={logout}>
        <button
          type="submit"
          className="min-h-[44px] px-5 border border-ds-key2/50 text-ds-key2 text-sm font-medium rounded-sm hover:bg-ds-key2/[0.12] transition-colors"
        >
          로그아웃
        </button>
      </form>
    </section>
  );
}

import { redirect } from 'next/navigation';
import { AdminNav } from '../AdminNav';
import { createClient } from '@/lib/supabase/server';
import { GuestbookAdmin, type AdminEntry } from './GuestbookAdmin';
import { groupRepliesByEntry, type GuestbookReply } from '@/lib/guestbook';
import type { HoldReason } from '@/lib/moderation';

/** 검토 화면이라 항상 최신 상태를 봐야 한다. */
export const dynamic = 'force-dynamic';

export default async function GuestbookAdminPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect('/admin/login');

  // 로그인 상태라 RLS의 `auth all` 정책이 걸려 숨긴 글까지 보인다.
  // `is_hearted` 는 0014 가 먼저 적용돼 있어야 한다. 없는 칸을 부르면 조회 자체가 42703 으로 실패한다.
  const { data, error } = await supabase
    .from('guestbook_entries')
    .select('id,name,message,is_held,is_hearted,hold_reasons,created_at')
    .order('created_at', { ascending: false });

  // 답글까지 한 번에 읽는다. 숨긴 글의 답글도 여기서는 보여야 한다.
  const { data: replyRows, error: replyError } = await supabase
    .from('guestbook_replies')
    .select('id,entry_id,message,created_at')
    .order('created_at', { ascending: true });

  const byEntry = groupRepliesByEntry(
    (replyRows ?? []).map(
      (r): GuestbookReply => ({
        id: r.id as string,
        entryId: r.entry_id as string,
        message: r.message as string,
        createdAt: r.created_at as string,
      }),
    ),
  );

  // 숨긴 글(검토 대기)을 위로 올린다.
  const entries: AdminEntry[] = (data ?? [])
    .map((r) => ({
      id: r.id as string,
      name: r.name as string,
      message: r.message as string,
      isHeld: r.is_held as boolean,
      isHearted: r.is_hearted as boolean,
      holdReasons: (r.hold_reasons ?? []) as HoldReason[],
      createdAt: r.created_at as string,
      replies: byEntry.get(r.id as string) ?? [],
    }))
    .sort((a, b) => Number(b.isHeld) - Number(a.isHeld));

  return (
    <section className="mx-auto max-w-[820px] px-5 py-[clamp(32px,6vw,56px)]">
      <AdminNav />
      <h1 className="mb-2 mt-3 font-heir text-[clamp(24px,5vw,32px)] font-bold text-ds-text">
        응원 게시판
      </h1>
      <p className="mb-8 text-sm text-ds-text/60">
        욕설·광고·연락처·도배로 보이는 글은 등록 시 자동으로 숨겨집니다. 왜 걸렸는지는 각
        글에 표시됩니다. 규칙은 우회가 쉬우니 걸린 글을 그대로 믿지 말고 한 번 읽어 보세요.
        멀쩡한 글이면 공개하면 됩니다.
        <br />
        답글은 운영진만 답니다. 남기면 게시판의 해당 쪽지 아래에 바로 붙습니다.
      </p>
      {replyError && (
        <p className="mb-6 border border-ds-key2/40 px-4 py-3 text-sm text-ds-text/70">
          답글을 불러오지 못했습니다. 마이그레이션 `0011_guestbook_replies.sql` 이 적용됐는지
          확인해 주세요. 응원글 검토는 그대로 쓸 수 있습니다.
        </p>
      )}
      {error ? (
        <p className="text-sm text-ds-text/60">
          목록을 불러오지 못했습니다. 마이그레이션 `0009_guestbook.sql`·`0014_guestbook_heart.sql`이 적용됐는지 확인해 주세요.
        </p>
      ) : (
        <GuestbookAdmin entries={entries} />
      )}
    </section>
  );
}

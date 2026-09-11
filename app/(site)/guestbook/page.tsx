import type { Metadata } from 'next';
import { createReadClient } from '@/lib/supabase/read';
import { GuestbookForm } from '@/components/guestbook/GuestbookForm';
import { GuestbookNote } from '@/components/guestbook/GuestbookNote';
import { GuestbookPager } from '@/components/guestbook/GuestbookPager';
import {
  PAGE_SIZE,
  groupRepliesByEntry,
  resolvePage,
  type GuestbookEntry,
  type GuestbookReply,
} from '@/lib/guestbook';
import { pageMeta } from '@/lib/pageMeta';
import { getContent } from '@/lib/content';

/** 응원글은 바로 보여야 하므로 캐시하지 않는다. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '응원 게시판',
  description: '창작뮤지컬 <나지르>를 준비하는 사람들에게 응원 한 마디를 남겨 주세요.',
  ...pageMeta('/guestbook'),
};

/**
 * 시안 `응원 게시판`. 제목 → 한 줄 입력 폼 → 쪽지 그리드(4열) → 페이지 이동.
 *
 * 답글은 운영진만 달고(명세 44행, docs/decisions.md C-2) 여기서는 읽기만 한다.
 * 하트는 제작팀이 켜는 표시다(C-3). 방문자 좋아요는 없다.
 *
 * 보류된 글(링크 포함)은 RLS가 걸러 공개 목록에도 총 개수에도 들어가지 않는다.
 */
export default async function GuestbookPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const { site } = await getContent();
  const supabase = createReadClient();

  let entries: GuestbookEntry[] = [];
  let replies: GuestbookReply[] = [];
  let page = 1;
  let totalPages = 1;
  let unavailable = false;

  if (!supabase) {
    unavailable = true;
  } else {
    const { count, error: countError } = await supabase
      .from('guestbook_entries')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      unavailable = true;
    } else {
      const resolved = resolvePage(rawPage, count ?? 0);
      page = resolved.page;
      totalPages = resolved.totalPages;
      const from = (page - 1) * PAGE_SIZE;

      const { data, error } = await supabase
        .from('guestbook_entries')
        .select('id,name,message,is_hearted,created_at')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) unavailable = true;
      else {
        entries = (data ?? []).map((r) => ({
          id: r.id as string,
          name: r.name as string,
          message: r.message as string,
          isHearted: (r.is_hearted ?? false) as boolean,
          createdAt: r.created_at as string,
        }));

        // 이 페이지에 보이는 글의 답글만 가져온다. 답글 조회가 실패해도 응원글은
        // 그대로 보여준다 — 곁가지 때문에 본문이 사라지면 안 된다.
        if (entries.length > 0) {
          const { data: replyRows } = await supabase
            .from('guestbook_replies')
            .select('id,entry_id,message,created_at')
            .in('entry_id', entries.map((e) => e.id))
            .order('created_at', { ascending: true });

          replies = (replyRows ?? []).map((r) => ({
            id: r.id as string,
            entryId: r.entry_id as string,
            message: r.message as string,
            createdAt: r.created_at as string,
          }));
        }
      }
    }
  }

  const byEntry = groupRepliesByEntry(replies);

  return (
    <section className="mx-auto max-w-content px-6 xl:px-8 py-[clamp(48px,7vw,88px)]">
      <header className="max-w-[497px]">
        <h1 className="font-heir text-[clamp(30px,4vw,45px)] leading-[1.4] tracking-[-0.025em] text-ds-text">
          응원 게시판
        </h1>
        {/* 관리자에서 고치는 문구다. 줄바꿈을 넣은 그대로 나가도록 pre-line 으로 둔다. */}
        {site.guestbookIntro.trim() && (
          <p className="mt-4 whitespace-pre-line font-desc font-extralight text-[15px] leading-[2] text-ds-text/70">
            {site.guestbookIntro}
          </p>
        )}
      </header>

      <div className="mt-[clamp(40px,6vw,72px)]">
        <GuestbookForm />
      </div>

      <div className="mt-[clamp(48px,7vw,96px)]">
        {unavailable ? (
          <p className="py-16 text-center font-heir text-[15px] text-ds-text/50">
            지금은 응원글을 불러올 수 없습니다. 잠시 후 다시 확인해 주세요.
          </p>
        ) : entries.length === 0 ? (
          <p className="py-16 text-center font-heir text-[15px] text-ds-text/50">
            아직 남겨진 응원이 없습니다. 첫 번째 응원을 남겨 주세요.
          </p>
        ) : (
          <>
            <ul className="grid list-none grid-cols-1 items-start gap-x-6 gap-y-12 p-0 sm:grid-cols-2 xl:grid-cols-4">
              {entries.map((entry, i) => (
                <GuestbookNote
                  key={entry.id}
                  entry={entry}
                  index={(page - 1) * PAGE_SIZE + i}
                  replies={byEntry.get(entry.id)}
                />
              ))}
            </ul>
            <GuestbookPager page={page} totalPages={totalPages} />
          </>
        )}
      </div>
    </section>
  );
}

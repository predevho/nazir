-- 응원글 답글 (요구사항 명세 44·45·47행)
--
-- 누가 다는가: 운영진만 — docs/decisions.md C-2.
--   응원 게시판은 방명록 성격이지 커뮤니티가 아니고, 공개 쓰기 엔드포인트를 하나 더
--   늘리면 스팸 표면과 모더레이션 부담이 그대로 두 배가 된다.
--   그래서 본문(submit_guestbook_entry)과 달리 SECURITY DEFINER 함수를 두지 않는다.
--   anon 에게는 읽기만 열고, 쓰기는 로그인 세션(authenticated)으로만 한다.
--
-- 1:N 테이블로 둔다(같은 문서). 지금은 한 글에 답글 하나로 충분하지만,
-- 나중에 여러 개가 필요하거나 "누구나 답글"로 열 때 마이그레이션을 피할 수 있다.
--
-- 배포 Supabase 대시보드 SQL Editor 에서 1회 실행. 재실행 안전.

create table if not exists guestbook_replies (
  id uuid primary key default gen_random_uuid(),
  -- 원글이 지워지면 답글도 함께 사라진다. 남겨두면 어디에도 붙지 못한 채 떠돈다.
  entry_id uuid not null references guestbook_entries (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists guestbook_replies_entry_idx
  on guestbook_replies (entry_id, created_at);

alter table guestbook_replies enable row level security;

-- 숨겨진 원글의 답글은 함께 가린다. 원글은 RLS 로 안 보이는데 답글만 새어 나가면
-- 가려 둔 내용이 답글 문맥으로 드러날 수 있다.
drop policy if exists "public read" on guestbook_replies;
create policy "public read" on guestbook_replies
  for select using (
    exists (
      select 1 from guestbook_entries e
      where e.id = guestbook_replies.entry_id and e.is_held = false
    )
  );

drop policy if exists "auth all" on guestbook_replies;
create policy "auth all" on guestbook_replies
  for all to authenticated using (true) with check (true);

-- 확인용:
-- select r.id, e.name as 원글작성자, r.message from guestbook_replies r
--   join guestbook_entries e on e.id = r.entry_id order by r.created_at desc;

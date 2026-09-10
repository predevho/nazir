-- 응원 게시판 (읽기·쓰기 1차)
-- 하트와 대댓글은 아직 확정 대기라 넣지 않았다 — docs/decisions.md C-2 · C-3.
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. 재실행 안전.

create table if not exists guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  ip_hash text not null default '',
  -- 링크가 섞인 글은 삭제하지 않고 숨겨만 둔다. 운영진이 보고 풀어준다 (decisions.md C-4).
  is_held boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists guestbook_entries_created_idx
  on guestbook_entries (created_at desc);
create index if not exists guestbook_entries_ip_recent_idx
  on guestbook_entries (ip_hash, created_at desc);

alter table guestbook_entries enable row level security;

-- 공개 읽기는 보류되지 않은 글만. anon 직접 insert는 막고 아래 함수로만 받는다.
drop policy if exists "public read" on guestbook_entries;
create policy "public read" on guestbook_entries
  for select using (is_held = false);

drop policy if exists "auth all" on guestbook_entries;
create policy "auth all" on guestbook_entries
  for all to authenticated using (true) with check (true);

-- 공개 작성. 방문자 집계(record_visit)와 같은 SECURITY DEFINER 패턴이다.
-- anon에게 테이블 insert 권한을 주지 않으므로, 브라우저에 노출된 anon 키로
-- 이 함수를 우회해 직접 넣을 수 없다.
create or replace function submit_guestbook_entry(
  p_name text,
  p_message text,
  p_ip_hash text default ''
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_message text := btrim(coalesce(p_message, ''));
  -- 공연 관람 후 같은 와이파이에서 여러 명이 남기는 상황을 고려해 넉넉히 잡는다
  -- (decisions.md C-4의 오탐 시나리오).
  v_cap constant int := 15;
  v_held boolean;
begin
  if v_name = '' or char_length(v_name) > 20 then
    return json_build_object('ok', false, 'reason', 'name');
  end if;
  if v_message = '' or char_length(v_message) > 300 then
    return json_build_object('ok', false, 'reason', 'message');
  end if;

  if p_ip_hash <> '' and (
    select count(*) from guestbook_entries
    where ip_hash = p_ip_hash and created_at > now() - interval '1 hour'
  ) >= v_cap then
    return json_build_object('ok', false, 'reason', 'rate');
  end if;

  v_held := v_message ~* '(https?://|www\.|\.com|\.net|\.kr/|\.io/)';

  insert into guestbook_entries (name, message, ip_hash, is_held)
  values (v_name, v_message, p_ip_hash, v_held);

  return json_build_object('ok', true, 'held', v_held);
end;
$$;

revoke all on function submit_guestbook_entry(text, text, text) from public;
grant execute on function submit_guestbook_entry(text, text, text) to anon, authenticated;

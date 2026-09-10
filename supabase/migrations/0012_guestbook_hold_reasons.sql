-- 응원글 보류 사유 기록 + 서버 판정 결과 받기
--
-- 지금까지 보류는 링크 하나뿐이었고, 왜 걸렸는지는 어디에도 남지 않았다.
-- 욕설·광고·도배까지 보게 되면서 운영진이 "무엇 때문에 걸렸는지"를 알아야 한다.
--
-- 판정 로직은 lib/moderation.ts 에 있다. 서버가 그 결과를 p_reasons 로 넘긴다.
-- 링크 검사는 여기에도 그대로 남긴다 — 아래 '우회' 주석 참고.
--
-- 배포 Supabase 대시보드 SQL Editor 에서 1회 실행. 재실행 안전.

begin;

alter table guestbook_entries
  add column if not exists hold_reasons text[] not null default '{}';

-- 인자 목록이 바뀌면 create or replace 가 아니라 새 함수가 된다. 지우고 다시 만든다.
-- 트랜잭션 안이라 이 사이에 등록이 실패하는 순간은 없다.
drop function if exists submit_guestbook_entry(text, text, text);

create or replace function submit_guestbook_entry(
  p_name text,
  p_message text,
  p_ip_hash text default '',
  p_reasons text[] default '{}'
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
  v_reasons text[] := coalesce(p_reasons, '{}');
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

  -- 우회 대비. 이 함수는 anon 에게도 열려 있어서, 브라우저 번들에 있는 키로
  -- 우리 API 라우트를 건너뛰고 직접 부를 수 있다. 그러면 lib/moderation.ts 의
  -- 판정이 통째로 생략되므로, 최소한 링크만은 DB 쪽에서 한 번 더 본다.
  -- (완전히 막으려면 anon 실행 권한을 걷고 서버 전용 키를 쓰는 별도 결정이 필요하다.)
  if v_message ~* '(https?://|www\.|\.com|\.net|\.kr/|\.io/)' and not ('link' = any(v_reasons)) then
    v_reasons := array_append(v_reasons, 'link');
  end if;

  insert into guestbook_entries (name, message, ip_hash, is_held, hold_reasons)
  values (v_name, v_message, p_ip_hash, array_length(v_reasons, 1) is not null, v_reasons);

  return json_build_object(
    'ok', true,
    'held', array_length(v_reasons, 1) is not null,
    'reasons', to_jsonb(v_reasons)
  );
end;
$$;

revoke all on function submit_guestbook_entry(text, text, text, text[]) from public;
grant execute on function submit_guestbook_entry(text, text, text, text[]) to anon, authenticated;

commit;

-- 확인용:
-- select name, is_held, hold_reasons, left(message, 30) from guestbook_entries
--   order by created_at desc limit 10;

-- 방문자 집계 인플레이션 방어: ip_hash 컬럼 + IP당 하루 상한(100)
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. 재실행 안전.
alter table visits add column if not exists ip_hash text not null default '';

-- record_visit를 (visitor_id, ip_hash default '')로 재정의(1-arg 호출도 하위호환).
drop function if exists record_visit(text);

create or replace function record_visit(p_visitor_id text, p_ip_hash text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_cap constant int := 100;
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 or length(p_visitor_id) > 64 then
    return;
  end if;
  if p_ip_hash <> '' then
    if (select count(*) from visits where ip_hash = p_ip_hash and visited_on = v_today) >= v_cap then
      return;
    end if;
  end if;
  insert into visits (visitor_id, visited_on, ip_hash)
  values (p_visitor_id, v_today, p_ip_hash)
  on conflict (visitor_id, visited_on) do nothing;
end;
$$;
revoke all on function record_visit(text, text) from public;
grant execute on function record_visit(text, text) to anon, authenticated;

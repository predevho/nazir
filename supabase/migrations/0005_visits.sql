-- 방문자 집계(순 방문자, 하루 1인 1행). 직접 접근은 막고 함수로만 기록/조회.
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. create if not exists / or replace로 재실행 안전.
create table if not exists visits (
  visitor_id text not null,
  visited_on date not null,
  primary key (visitor_id, visited_on)
);
alter table visits enable row level security;
-- 정책 없음 → anon/authenticated 직접 접근 불가. 아래 SECURITY DEFINER 함수로만.

-- 방문 기록: 오늘(KST) 기준 (visitor_id, 오늘) upsert, 중복 무시.
create or replace function record_visit(p_visitor_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_visitor_id is null or length(p_visitor_id) < 8 or length(p_visitor_id) > 64 then
    return;
  end if;
  insert into visits (visitor_id, visited_on)
  values (p_visitor_id, (now() at time zone 'Asia/Seoul')::date)
  on conflict (visitor_id, visited_on) do nothing;
end;
$$;
revoke all on function record_visit(text) from public;
grant execute on function record_visit(text) to anon, authenticated;

-- 통계: 오늘·총(distinct)·최근 7일(0 포함) json. 관리자만.
create or replace function get_visit_stats()
returns json
language sql
security definer
set search_path = public
as $$
  with today as (select (now() at time zone 'Asia/Seoul')::date as d)
  select json_build_object(
    'today', (select count(*) from visits, today where visited_on = today.d),
    'total', (select count(distinct visitor_id) from visits),
    'last7', (
      select coalesce(json_agg(json_build_object('day', to_char(gs.d, 'MM-DD'), 'count', coalesce(c.cnt, 0)) order by gs.d), '[]'::json)
      from (
        select ((select d from today) - g)::date as d
        from generate_series(6, 0, -1) as g
      ) gs
      left join (
        select visited_on, count(*) as cnt from visits group by visited_on
      ) c on c.visited_on = gs.d
    )
  );
$$;
revoke all on function get_visit_stats() from public;
grant execute on function get_visit_stats() to authenticated;

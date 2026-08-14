-- 참여자 세부팀·한줄소개 (people 3단계 외형 + 개인 상세)
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. where 가드로 재실행 안전.
alter table people_members add column if not exists team text not null default '';
alter table people_members add column if not exists tagline text not null default '';

-- 팀원 그룹(g1)은 기존 role에 팀명(기획팀·미디어팀…)이 있으므로 team으로 옮기고 role은 비운다.
-- 헤더진(g0)의 role은 개별 직책이라 건드리지 않는다. g0의 team은 관리자가 편집기에서 지정.
update people_members set team = role, role = '' where group_id = 'g1' and team = '';

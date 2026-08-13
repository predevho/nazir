-- 참여자 명단을 개인 단위로 재구성 (Phase 3B-3a)
-- ⚠️ 1회만 실행하세요. 재실행 시 people_members가 아래 시드 상태로 초기화됩니다.
-- 대시보드 SQL Editor에 전체를 붙여넣어 실행.

alter table people_members add column if not exists role text not null default '';
alter table people_members add column if not exists name text not null default '';
alter table people_members add column if not exists bio text not null default '';
alter table people_members add column if not exists photo_url text;

-- 기존 행 제거 후, NOT NULL인 옛 text 컬럼을 먼저 제거해야 아래 insert(=text 미제공)가 통과한다.
delete from people_members;
alter table people_members drop column if exists text;

insert into people_members (id, group_id, role, name, bio, sort_order) values
  ('g0m0','g0','연출','정은수','',0),
  ('g0m1','g0','조연출','권도원','',1),
  ('g0m2','g0','디자인팀장','정은민','',2),
  ('g0m3','g0','미디어팀장','김수연','',3),
  ('g0m4','g0','홍보팀장','홍빛','',4),
  ('g0m5','g0','무대감독','이하은','',5),
  ('g0m6','g0','안무팀장','이하늘','',6),
  ('g0m7','g0','의소품팀장','김가은','',7),
  ('g1m0','g1','기획팀','김은성','',0),
  ('g1m1','g1','기획팀','장시은','',1),
  ('g1m2','g1','디자인팀','구정서','',2),
  ('g1m3','g1','미디어팀','안새진','',3),
  ('g1m4','g1','미디어팀','권은수','',4),
  ('g1m5','g1','미디어팀','박지유','',5),
  ('g1m6','g1','홍보팀','임은혜','',6),
  ('g1m7','g1','무대팀','박명인','',7),
  ('g1m8','g1','의소품팀','오주형','',8),
  ('g1m9','g1','음향·음악팀','김시온','',9),
  ('g1m10','g1','음향·음악팀','강민규','',10),
  ('g1m11','g1','음향·음악팀','김태범','',11),
  ('g1m12','g1','음향·음악팀','배유미','',12),
  ('g1m13','g1','음향·음악팀','봉승빈','',13),
  ('g1m14','g1','음향·음악팀','봉종빈','',14),
  ('g1m15','g1','음향·음악팀','주찬영','',15),
  ('g1m16','g1','음향·음악팀','최요한','',16),
  ('g1m17','g1','음향·음악팀','이시온','',17),
  ('g2m0','g2','','정주은','',0),
  ('g2m1','g2','','신현택','',1),
  ('g2m2','g2','','박주은','',2),
  ('g2m3','g2','','김수','',3),
  ('g2m4','g2','','박승주','',4),
  ('g2m5','g2','','장지훈','',5),
  ('g2m6','g2','','예수아','',6),
  ('g2m7','g2','','예재빈','',7),
  ('g2m8','g2','','오예현','',8),
  ('g2m9','g2','','정영인','',9),
  ('g2m10','g2','','진예빈','',10),
  ('g2m11','g2','','추서연','',11),
  ('g2m12','g2','','고은수','',12),
  ('g2m13','g2','','양다인','',13),
  ('g2m14','g2','','임현민','',14),
  ('g2m15','g2','','정수지','',15),
  ('g2m16','g2','','정인준','',16)
on conflict (id) do update set
  group_id = excluded.group_id, role = excluded.role, name = excluded.name,
  bio = excluded.bio, sort_order = excluded.sort_order;

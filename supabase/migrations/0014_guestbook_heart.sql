-- 제작팀 하트 (클라이언트 확정 2026-09-11: "응원 쪽지 하트는 제작팀용")
--
-- 운영진이 응원글에 감사 표시로 켜고 끄는 boolean 하나다. 방문자 좋아요가 아니다.
-- 방문자 카운트로 만들면 중복 방지 테이블과 봇 대응이 따라오는데, 숫자의 신뢰도는 낮고
-- 어뷰징 표면만 늘어난다 — docs/decisions.md C-3.
--
-- 쓰기는 기존 `auth all` 정책(0009)이 authenticated 의 update 를 허용하므로 정책 추가 없음.
-- anon 은 `public read` 로 읽기만 한다.
--
-- 배포 Supabase 대시보드 SQL Editor 에서 1회 실행. 재실행 안전.

alter table guestbook_entries
  add column if not exists is_hearted boolean not null default false;

-- 확인용:
-- select id, name, is_hearted from guestbook_entries where is_hearted order by created_at desc;

-- 〈나지르〉에 대하여 01·02의 편지 이미지
-- 요구사항 명세서 15~16행(연출의 인사말 이미지 슬라이드·관리), 18~19행(Praysound 동일).
-- 장수를 고정하지 않는다. 운영진이 관리자 페이지에서 넣는 만큼 페이저가 `1 / N`으로 따라간다
-- (디자이너 질문에 대한 답: 시안의 `1 / 5`는 고정값이 아니다).
--
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. if not exists 가드로 재실행 안전.

create table if not exists about_letters (
  id text primary key,
  section text not null check (section in ('greeting', 'praysound')),
  image_url text,
  caption text not null default '',
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

alter table about_letters enable row level security;

drop policy if exists "public read" on about_letters;
drop policy if exists "auth write" on about_letters;
create policy "public read" on about_letters for select using (true);
create policy "auth write" on about_letters for all to authenticated using (true) with check (true);

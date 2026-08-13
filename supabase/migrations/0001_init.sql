-- 나지르 콘텐츠 스키마 · RLS · Storage (Phase 2B)
-- 대시보드 SQL Editor에 이 파일 전체를 붙여넣어 실행하세요.

-- ── 테이블 ─────────────────────────────────────────────
create table if not exists content_blocks (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

create table if not exists facts (
  id text primary key,
  key text not null,
  value text not null,
  sort_order int not null default 0
);

create table if not exists characters (
  id text primary key,
  name text not null,
  description text not null,
  photo_url text,
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists timeline_events (
  id text primary key,
  period text not null,
  title text not null,
  status text not null check (status in ('완료', '진행 중', '예정')),
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists budget_items (
  id text primary key,
  name text not null,
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists prayers (
  id text primary key,
  text text not null,
  sort_order int not null default 0,
  updated_at timestamptz default now()
);

create table if not exists people_groups (
  id text primary key,
  label text not null,
  sort_order int not null default 0
);

create table if not exists people_members (
  id text primary key,
  group_id text not null references people_groups(id) on delete cascade,
  text text not null,
  sort_order int not null default 0
);

-- ── RLS: 공개 읽기, 쓰기는 인증 사용자(관리자, Phase 3) ──
alter table content_blocks   enable row level security;
alter table facts            enable row level security;
alter table characters       enable row level security;
alter table timeline_events  enable row level security;
alter table budget_items     enable row level security;
alter table prayers          enable row level security;
alter table people_groups    enable row level security;
alter table people_members   enable row level security;

drop policy if exists "public read"  on content_blocks;
drop policy if exists "auth write"    on content_blocks;
create policy "public read" on content_blocks for select using (true);
create policy "auth write"  on content_blocks for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on facts;
drop policy if exists "auth write"    on facts;
create policy "public read" on facts for select using (true);
create policy "auth write"  on facts for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on characters;
drop policy if exists "auth write"    on characters;
create policy "public read" on characters for select using (true);
create policy "auth write"  on characters for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on timeline_events;
drop policy if exists "auth write"    on timeline_events;
create policy "public read" on timeline_events for select using (true);
create policy "auth write"  on timeline_events for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on budget_items;
drop policy if exists "auth write"    on budget_items;
create policy "public read" on budget_items for select using (true);
create policy "auth write"  on budget_items for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on prayers;
drop policy if exists "auth write"    on prayers;
create policy "public read" on prayers for select using (true);
create policy "auth write"  on prayers for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on people_groups;
drop policy if exists "auth write"    on people_groups;
create policy "public read" on people_groups for select using (true);
create policy "auth write"  on people_groups for all to authenticated using (true) with check (true);

drop policy if exists "public read"  on people_members;
drop policy if exists "auth write"    on people_members;
create policy "public read" on people_members for select using (true);
create policy "auth write"  on people_members for all to authenticated using (true) with check (true);

-- ── Storage: 공개 이미지 버킷(사진 업로드는 Phase 3) ──
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "public read images" on storage.objects;
drop policy if exists "auth write images" on storage.objects;
create policy "public read images"
  on storage.objects for select
  using (bucket_id = 'images');
create policy "auth write images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'images');

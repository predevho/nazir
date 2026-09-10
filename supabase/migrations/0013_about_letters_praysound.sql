-- 〈나지르〉에 대하여 02(Praysound에 대하여) 이미지 7장
--
-- 인스타그램 `Nazir Story #1 | Who is PRAYSOUND` 카드 뉴스를 그대로 옮겼다.
-- 파일은 public/images/about-praysound-1~7.webp (1268×1585, 4:5).
--
-- 원본이 4:5 이고 사방 가장자리까지 사진이 꽉 차 있어, 편지(634:846)와 같은 틀에
-- 넣고 잘라내면 글자와 인물이 잘린다. 그래서 이 화면만 틀을 4:5 로 둔다
-- — content/about.ts 의 letterAspect.
--
-- 배포 Supabase 대시보드 SQL Editor 에서 1회 실행. on conflict 가드로 재실행 안전.

insert into about_letters (id, section, image_url, caption, sort_order) values
  ('p1', 'praysound', '/images/about-praysound-1.webp', 'Praysound 이야기 1 — What is ''Pray Sound''?', 0),
  ('p2', 'praysound', '/images/about-praysound-2.webp', 'Praysound 이야기 2', 1),
  ('p3', 'praysound', '/images/about-praysound-3.webp', 'Praysound 이야기 3 — How did Pray Sound begin?', 2),
  ('p4', 'praysound', '/images/about-praysound-4.webp', 'Praysound 이야기 4', 3),
  ('p5', 'praysound', '/images/about-praysound-5.webp', 'Praysound 이야기 5', 4),
  ('p6', 'praysound', '/images/about-praysound-6.webp', 'Praysound 이야기 6', 5),
  ('p7', 'praysound', '/images/about-praysound-7.webp', 'Praysound 이야기 7', 6)
on conflict (id) do update
  set section    = excluded.section,
      image_url  = excluded.image_url,
      caption    = excluded.caption,
      sort_order = excluded.sort_order;

-- 확인용: greeting 2장 + praysound 7장이 순서대로 나오면 정상이다.
-- select section, sort_order, image_url from about_letters order by section, sort_order;

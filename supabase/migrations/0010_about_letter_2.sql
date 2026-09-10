-- 〈나지르〉에 대하여 01(연출의 인사말)의 편지 2장째를 등록한다.
-- 인스타그램 `The Leader's Letter` 게시물 두 장 중 뒷장이며, 파일은
-- public/images/about-letter-2.webp 로 저장소에 함께 들어가 있다(1268×1691 WebP, 261KB).
--
-- 0008 에서 만든 about_letters 테이블이 콘텐츠의 원본이다. content/data.ts 의 시드는
-- 테이블이 없는 배포에서만 쓰이므로, 실제 화면에 나오게 하려면 이 행이 필요하다.
--
-- 배포 Supabase 대시보드 SQL Editor 에서 1회 실행. on conflict 가드로 재실행 안전.

insert into about_letters (id, section, image_url, caption, sort_order)
values (
  'l1',
  'greeting',
  '/images/about-letter-2.webp',
  '리더의 편지 2장 — 사명을 찾는 길에는 많은 수고와 어려움이 따르는 것 같습니다',
  1
)
on conflict (id) do update
  set section    = excluded.section,
      image_url  = excluded.image_url,
      caption    = excluded.caption,
      sort_order = excluded.sort_order;

-- 확인용: greeting 편지가 sort_order 순으로 두 장 나오면 정상이다.
-- select id, section, image_url, sort_order from about_letters order by section, sort_order;

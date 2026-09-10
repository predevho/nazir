/**
 * 상단 메뉴 5개. 라벨은 Figma `개발자용 페이지` 그대로다(꺾쇠 없음).
 *
 * 헤더와 404 화면이 같은 목록을 쓴다. 각자 들고 있으면 메뉴가 하나 늘거나 이름이 바뀔 때
 * 한쪽만 고쳐진다.
 */
export type NavItem = { to: string; label: string };

export const NAV_ITEMS: NavItem[] = [
  { to: '/about', label: '나지르에 대하여' },
  { to: '/process', label: '제작 과정' },
  { to: '/people', label: '함께하는 사람들' },
  { to: '/join', label: '후원과 기도' },
  { to: '/guestbook', label: '응원 게시판' },
];

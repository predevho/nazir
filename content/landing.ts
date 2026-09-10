/**
 * 랜딩 카드 5개. 문구는 Figma `개발자용 페이지` > `랜딩페이지`(355:945)에서 그대로 옮겼다.
 *
 * ⚠️ 시안의 3·4·5번 카드 설명은 1번 카드 문구가 그대로 복붙돼 있어(미작성 상태)
 * 각 섹션에 맞는 임시 문구를 넣었다. 클라이언트 확정 문구가 오면 교체할 것
 * — docs/figma-spec-review.md 참고.
 */
export interface LandingCard {
  to: string;
  title: string;
  subtitle: string;
  description: string;
  /** public/images/ 의 아이콘. 없으면 아이콘 자리가 비어 보일 뿐 레이아웃은 유지된다. */
  icon: string;
  /** 설명 문구가 시안에서 확정된 것인지. false면 시안 미작성이라 임시로 채운 문구다. */
  copyConfirmed: boolean;
}

export const LANDING_CARDS: LandingCard[] = [
  {
    to: '/about',
    title: '<나지르>에 대하여',
    subtitle: '연출의 인사말 · Praysound · 작품 소개',
    description: 'Praysound가 전하고 싶었던 위로가\n창작뮤지컬 <나지르>로 이어진\n여정을 소개합니다.',
    icon: '/images/landing-icon-1.png',
    copyConfirmed: true,
  },
  {
    to: '/process',
    title: '제작 과정',
    subtitle: '제작 일정 · 제작 예산',
    description: '<나지르>가 무대에 오르기까지\n준비 과정과 앞으로의 필요를\n공유합니다.',
    icon: '/images/landing-icon-2.png',
    copyConfirmed: true,
  },
  {
    to: '/people',
    title: '함께하는 사람들',
    subtitle: '헤더진 · 스탭진 · 배우',
    // 시안 미작성(1번 카드 복붙) — 임시 문구
    description: '각자의 자리에서 기도하며\n<나지르>를 함께 세워가는\n사람들을 소개합니다.',
    icon: '/images/landing-icon-3.png',
    copyConfirmed: false,
  },
  {
    to: '/join',
    title: '후원과 기도',
    subtitle: '후원으로 함께하기 · 기도로 동참하기',
    // 시안 미작성(1번 카드 복붙) — 임시 문구
    description: '이 무대가 온전히 세워지도록\n후원과 기도로 함께해 주세요.',
    icon: '/images/landing-icon-4.png',
    copyConfirmed: false,
  },
  {
    to: '/guestbook',
    title: '응원 게시판',
    subtitle: '<나지르>를 향한 응원의 한마디',
    // 시안 미작성(1번 카드 복붙) — 임시 문구
    description: '준비하는 사람들에게 남기는\n짧은 응원 한 마디가\n큰 힘이 됩니다.',
    icon: '/images/landing-icon-5.png',
    copyConfirmed: false,
  },
];

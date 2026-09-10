/**
 * `<나지르>에 대하여` 4개 서브페이지. 시안 `개발자용 페이지`의 프레임 4개에 대응한다.
 *
 * 시안 순서는 01 연출의 인사말 → 02 Praysound에 대하여 → 03 작품 소개 → 04 작품 속 인물이고,
 * 하단 도트 4개로 서로 이동한다(코멘트 #45에서 3개 → 4개로 수정 완료).
 */
export type AboutSlug = 'greeting' | 'praysound' | 'work' | 'characters';

export interface AboutSection {
  slug: AboutSlug;
  /** 시안 좌측 상단의 `01` ~ `04` */
  no: string;
  title: string;
}

export const ABOUT_SECTIONS: AboutSection[] = [
  { slug: 'greeting', no: '01', title: '연출의 인사말' },
  { slug: 'praysound', no: '02', title: 'Praysound에 대하여' },
  { slug: 'work', no: '03', title: '작품 소개' },
  { slug: 'characters', no: '04', title: '작품 속 인물' },
];

/**
 * 01·02는 편지 이미지를 좌우로 넘겨 보는 구조다(요구사항 명세서 14~16행, 18~19행).
 * 이미지는 코드가 아니라 `about_letters` 테이블에 있고 운영진이 관리자 페이지에서 넣고 뺀다.
 * 장수는 고정이 아니라 등록한 개수만큼 `1 / N`으로 표시된다.
 */
export const LETTER_SECTIONS: AboutSlug[] = ['greeting', 'praysound'];

export function hasLetterCarousel(slug: AboutSlug): boolean {
  return LETTER_SECTIONS.includes(slug);
}

/**
 * 두 화면에 들어가는 그림의 성격이 다르다.
 *
 * - `greeting` — 손편지 사진. 시안이 정한 634×846 이다.
 * - `praysound` — 인스타그램에 올린 카드 뉴스 7장. 4:5(1440×1800)로 만들어졌고,
 *   사방 가장자리까지 사진이 꽉 차 있어 잘라내면 글자와 인물이 잘린다.
 *   틀을 그림에 맞추는 편이 그림을 틀에 맞추는 것보다 낫다.
 *
 * 값은 Tailwind 의 `aspect-[...]` 에 그대로 들어간다.
 */
const LETTER_ASPECT: Record<AboutSlug, string> = {
  greeting: '634/846',
  praysound: '4/5',
  work: '634/846',
  characters: '634/846',
};

export function letterAspect(slug: AboutSlug): string {
  return LETTER_ASPECT[slug];
}

export function findAboutSection(slug: string): AboutSection | undefined {
  return ABOUT_SECTIONS.find((s) => s.slug === slug);
}

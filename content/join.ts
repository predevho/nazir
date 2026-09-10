/**
 * `후원과 기도` 2개 서브페이지. 시안 `개발자용 페이지`의 프레임 2개에 대응한다.
 * 하단 도트 2개로 서로 이동한다.
 */
export type JoinSlug = 'support' | 'prayer';

export interface JoinSection {
  slug: JoinSlug;
  /** 시안 좌측 상단의 `01` · `02` */
  no: string;
  title: string;
}

export const JOIN_SECTIONS: JoinSection[] = [
  { slug: 'support', no: '01', title: '후원으로 함께하기' },
  { slug: 'prayer', no: '02', title: '기도로 동참하기' },
];

export function findJoinSection(slug: string): JoinSection | undefined {
  return JOIN_SECTIONS.find((s) => s.slug === slug);
}

/**
 * `제작 과정` 2개 서브페이지. 시안 `개발자용 페이지`의 프레임 2개에 대응한다.
 * 하단 도트 2개로 서로 이동한다.
 */
export type ProcessSlug = 'schedule' | 'budget';

export interface ProcessSection {
  slug: ProcessSlug;
  /** 시안 좌측 상단의 `01` · `02` */
  no: string;
  title: string;
}

export const PROCESS_SECTIONS: ProcessSection[] = [
  { slug: 'schedule', no: '01', title: '제작 과정' },
  { slug: 'budget', no: '02', title: '제작 예산' },
];

export function findProcessSection(slug: string): ProcessSection | undefined {
  return PROCESS_SECTIONS.find((s) => s.slug === slug);
}

/** 시안이 각 카드에 기본으로 보여주는 일정 개수. 나머지는 `외 N개의 기록 더보기`로 접힌다. */
export const TIMELINE_PREVIEW_COUNT = 5;

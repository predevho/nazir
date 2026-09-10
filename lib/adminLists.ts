export type ListColumn = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'image';
  options?: { value: string; label: string }[];
  markdown?: boolean;
};

/** 이 목록이 실제로 나오는 공개 화면. 미리보기 제목과 `↗` 링크에 쓴다. */
export type ListWhere = { path: string; label: string };

export type ListConfig = {
  key: string;
  table: string;
  title: string;
  columns: ListColumn[];
  where: ListWhere;
};

export const ADMIN_LISTS: Record<string, ListConfig> = {
  facts: {
    key: 'facts',
    where: { path: '/about/work', label: '〈나지르〉에 대하여 03 · 작품 개요' },
    table: 'facts',
    title: '작품 개요',
    columns: [
      { key: 'key', label: '항목 (예: FORM)', type: 'text' },
      { key: 'value', label: '내용', type: 'text' },
    ],
  },
  characters: {
    key: 'characters',
    where: { path: '/about/characters', label: '〈나지르〉에 대하여 04 · 작품 속 인물' },
    table: 'characters',
    title: '주요 등장인물',
    columns: [
      { key: 'photo_url', label: '사진', type: 'image' },
      { key: 'name', label: '이름', type: 'text' },
      { key: 'description', label: '설명', type: 'textarea', markdown: true },
    ],
  },
  timeline: {
    key: 'timeline',
    where: { path: '/process/schedule', label: '제작 과정 01 · 제작 일정' },
    table: 'timeline_events',
    title: '제작 일정',
    columns: [
      { key: 'period', label: '기간 (예: 26.01.12 ~ 26.06.28)', type: 'text' },
      { key: 'title', label: '내용', type: 'text' },
      {
        key: 'status',
        label: '상태',
        type: 'select',
        options: [
          { value: '완료', label: '완료' },
          { value: '진행 중', label: '진행 중' },
          { value: '예정', label: '예정' },
        ],
      },
    ],
  },
  budget: {
    key: 'budget',
    where: { path: '/process/budget', label: '제작 과정 02 · 제작 예산' },
    table: 'budget_items',
    title: '제작 예산 항목',
    columns: [{ key: 'name', label: '항목명', type: 'text' }],
  },
  prayers: {
    key: 'prayers',
    where: { path: '/join/prayer', label: '후원과 기도 02 · 기도 제목' },
    table: 'prayers',
    title: '기도제목',
    columns: [{ key: 'text', label: '내용', type: 'textarea' }],
  },
  letters: {
    key: 'letters',
    where: { path: '/about/greeting', label: '〈나지르〉에 대하여 01 · 02' },
    table: 'about_letters',
    title: '편지 이미지 (〈나지르〉에 대하여 01·02)',
    columns: [
      {
        key: 'section',
        label: '들어갈 페이지',
        type: 'select',
        options: [
          { value: 'greeting', label: '01 연출의 인사말' },
          { value: 'praysound', label: '02 Praysound에 대하여' },
        ],
      },
      { key: 'image_url', label: '이미지', type: 'image' },
      { key: 'caption', label: '설명 (화면에는 안 보이고, 이미지가 안 뜰 때·낭독기에서 읽힘)', type: 'text' },
    ],
  },
};

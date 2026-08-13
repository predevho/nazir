export type ListColumn = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
};

export type ListConfig = {
  key: string;
  table: string;
  title: string;
  columns: ListColumn[];
};

export const ADMIN_LISTS: Record<string, ListConfig> = {
  facts: {
    key: 'facts',
    table: 'facts',
    title: '작품 개요',
    columns: [
      { key: 'key', label: '항목 (예: FORM)', type: 'text' },
      { key: 'value', label: '내용', type: 'text' },
    ],
  },
  characters: {
    key: 'characters',
    table: 'characters',
    title: '주요 등장인물',
    columns: [
      { key: 'name', label: '이름', type: 'text' },
      { key: 'description', label: '설명', type: 'textarea' },
    ],
  },
  timeline: {
    key: 'timeline',
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
    table: 'budget_items',
    title: '제작 예산 항목',
    columns: [{ key: 'name', label: '항목명', type: 'text' }],
  },
  prayers: {
    key: 'prayers',
    table: 'prayers',
    title: '기도제목',
    columns: [{ key: 'text', label: '내용', type: 'textarea' }],
  },
};

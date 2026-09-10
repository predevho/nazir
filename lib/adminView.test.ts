import { describe, it, expect } from 'vitest';
import { applyView, moveWithinVisible, sortForView, EMPTY_VIEW, ADMIN_PAGE_SIZE } from './adminView';

type Row = { k: string; name: string; status: string };
const rows: Row[] = [
  { k: 'a', name: '대본 작업', status: '완료' },
  { k: 'b', name: '배우 오디션', status: '완료' },
  { k: 'c', name: '넘버 편곡', status: '진행 중' },
  { k: 'd', name: '여름 합숙', status: '예정' },
  { k: 'e', name: '겨울 합숙', status: '예정' },
];
const view = (over: Partial<typeof EMPTY_VIEW> = {}) => ({ ...EMPTY_VIEW, ...over });
const text = (r: Row) => `${r.name} ${r.status}`;
const facet = (r: Row) => r.status;

describe('applyView — 필터', () => {
  it('아무것도 안 걸면 전부 보인다', () => {
    const v = applyView(rows, view(), { text, pageSize: 10 });
    expect(v.visible).toHaveLength(5);
    expect(v.total).toBe(5);
  });

  it('상태로 거른다', () => {
    const v = applyView(rows, view({ facet: '예정' }), { text, facet, pageSize: 10 });
    expect(v.visible.map((r) => r.k)).toEqual(['d', 'e']);
    // total 은 걸러내기 전 전체다 — "5개 중 2개" 를 보여줘야 한다
    expect(v.total).toBe(5);
  });

  it('검색어로 거른다', () => {
    expect(applyView(rows, view({ query: '합숙' }), { text }).visible.map((r) => r.k)).toEqual(['d', 'e']);
  });

  it('검색어와 상태를 함께 건다', () => {
    const v = applyView(rows, view({ query: '합숙', facet: '예정' }), { text, facet });
    expect(v.visible).toHaveLength(2);
  });

  it('대소문자와 앞뒤 공백은 무시한다', () => {
    expect(applyView(rows, view({ query: '  대본  ' }), { text }).visible).toHaveLength(1);
  });

  it('facet 함수를 안 주면 필터값이 있어도 무시한다', () => {
    // 셀렉트 칸이 없는 목록에서 필터가 남아 있어도 전부 사라지면 안 된다
    expect(applyView(rows, view({ facet: '예정' }), { text }).visible).toHaveLength(5);
  });
});

describe('applyView — 페이지', () => {
  it('한 화면 분량으로 자른다', () => {
    const v = applyView(rows, view(), { text, pageSize: 2 });
    expect(v.visible.map((r) => r.k)).toEqual(['a', 'b']);
    expect(v.pages).toBe(3);
  });

  it('다음 장을 준다', () => {
    expect(applyView(rows, view({ page: 2 }), { text, pageSize: 2 }).visible.map((r) => r.k)).toEqual(['c', 'd']);
  });

  it('필터로 페이지 수가 줄면 조용히 마지막 장으로 당긴다', () => {
    // 3장을 보다가 '예정'으로 거르면 1장뿐이다. 빈 화면을 보여주면 안 된다.
    const v = applyView(rows, view({ facet: '예정', page: 3 }), { text, facet, pageSize: 2 });
    expect(v.page).toBe(1);
    expect(v.visible).toHaveLength(2);
  });

  it('이상한 페이지 값도 화면을 깨지 않는다', () => {
    for (const p of [0, -5, NaN, 999]) {
      const v = applyView(rows, view({ page: p as number }), { text, pageSize: 2 });
      expect(v.visible.length).toBeGreaterThan(0);
      expect(v.page).toBeGreaterThanOrEqual(1);
    }
  });

  it('아무것도 안 걸리면 0개지만 페이지는 1이다', () => {
    const v = applyView(rows, view({ query: '없는말' }), { text });
    expect(v.visible).toHaveLength(0);
    expect(v.pages).toBe(1);
  });

  it('기본 한 화면 크기가 정해져 있다', () => {
    expect(ADMIN_PAGE_SIZE).toBeGreaterThan(0);
  });
});

describe('moveWithinVisible', () => {
  const keyOf = (r: Row) => r.k;

  it('필터가 없으면 바로 앞뒤와 바꾼다', () => {
    const moved = moveWithinVisible(rows, rows, 'c', -1, keyOf);
    expect(moved.map((r) => r.k)).toEqual(['a', 'c', 'b', 'd', 'e']);
  });

  it('필터가 걸리면 화면에 보이는 이웃과 바꾼다 — 안 보이는 행과 바꾸면 아무 일도 안 한 것처럼 보인다', () => {
    const visible = rows.filter((r) => r.status === '예정'); // d, e
    const moved = moveWithinVisible(rows, visible, 'e', -1, keyOf);
    // 전체 배열에서 d 와 e 의 자리가 바뀐다
    expect(moved.map((r) => r.k)).toEqual(['a', 'b', 'c', 'e', 'd']);
  });

  it('보이는 목록의 처음·끝에서는 그대로 둔다', () => {
    const visible = rows.filter((r) => r.status === '예정');
    expect(moveWithinVisible(rows, visible, 'd', -1, keyOf)).toBe(rows);
    expect(moveWithinVisible(rows, visible, 'e', 1, keyOf)).toBe(rows);
  });

  it('모르는 키는 그대로 둔다', () => {
    expect(moveWithinVisible(rows, rows, 'zzz', 1, keyOf)).toBe(rows);
  });
});

describe('sortForView', () => {
  it('정해준 차례로 모아 본다', () => {
    const sorted = sortForView(rows, ['예정', '진행 중', '완료'], (r) => r.status);
    expect(sorted.map((r) => r.status)).toEqual(['예정', '예정', '진행 중', '완료', '완료']);
  });

  it('같은 값끼리는 원래 순서를 지킨다', () => {
    const sorted = sortForView(rows, ['완료'], (r) => r.status);
    expect(sorted.slice(0, 2).map((r) => r.k)).toEqual(['a', 'b']);
  });

  it('원본을 건드리지 않는다 — 저장되는 순서는 그대로여야 한다', () => {
    const before = rows.map((r) => r.k);
    sortForView(rows, ['예정'], (r) => r.status);
    expect(rows.map((r) => r.k)).toEqual(before);
  });

  it('정렬을 끄면 손댄 순서 그대로다', () => {
    expect(sortForView(rows, null, (r) => r.status)).toBe(rows);
  });
});

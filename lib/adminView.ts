/**
 * 관리자 목록 편집기의 **보기** 상태 — 검색·필터·정렬·페이지.
 *
 * 저장과는 무관하다. 편집기는 화면에 무엇이 보이든 **전체 배열**을 한 번에 보낸다
 * (ListEditor 의 `payload`, PeopleEditor 의 `payload`). 그래서 여기서 걸러낸 행도
 * 저장에서 빠지지 않는다. 이 파일이 하는 일은 "무엇을 그릴지" 고르는 것뿐이다.
 */

/** 한 화면에 그릴 행 수. 제작 일정 20개·참여자 43명이 한 번에 쏟아지던 것을 끊는다. */
export const ADMIN_PAGE_SIZE = 10;

export interface ViewState {
  /** 자유 검색어. 행의 모든 칸을 이어 붙인 문자열에서 찾는다. */
  query: string;
  /** 셀렉트 칸 기준 필터. 빈 문자열이면 전체. */
  facet: string;
  /** 1부터 */
  page: number;
}

export const EMPTY_VIEW: ViewState = { query: '', facet: '', page: 1 };

export interface ViewResult<T> {
  /** 이번 화면에 그릴 것 */
  visible: T[];
  /** 검색·필터를 통과한 전체 (페이지 자르기 전) */
  matched: T[];
  total: number;
  pages: number;
  /** 범위를 벗어난 값이 들어와도 실제로 쓰인 페이지 */
  page: number;
}

/**
 * 검색어를 눕힌다. 대소문자와 앞뒤 공백만 없앤다 —
 * 관리자 검색은 이름·역할처럼 짧은 말을 찾는 일이라 이 정도면 충분하다.
 */
function norm(s: string): string {
  return s.toLowerCase().trim();
}

export function applyView<T>(
  rows: T[],
  view: ViewState,
  opts: {
    /** 검색 대상이 되는 문자열 */
    text: (row: T) => string;
    /** 필터 기준값. 없으면 필터를 쓰지 않는다는 뜻이다. */
    facet?: (row: T) => string;
    pageSize?: number;
  },
): ViewResult<T> {
  const size = opts.pageSize ?? ADMIN_PAGE_SIZE;
  const q = norm(view.query);

  const matched = rows.filter((row) => {
    if (view.facet && opts.facet && opts.facet(row) !== view.facet) return false;
    if (q && !norm(opts.text(row)).includes(q)) return false;
    return true;
  });

  const pages = Math.max(1, Math.ceil(matched.length / size));
  // 필터를 좁혀 페이지 수가 줄면 지금 페이지가 범위를 벗어난다. 조용히 마지막으로 당긴다.
  const page = Math.min(Math.max(1, Math.floor(view.page) || 1), pages);
  const from = (page - 1) * size;

  return { visible: matched.slice(from, from + size), matched, total: rows.length, pages, page };
}

/**
 * 화면에 보이는 것끼리 자리를 바꾼다.
 *
 * 순진하게 전체 배열에서 앞뒤를 바꾸면, 필터가 걸린 상태에서는 **안 보이는 행**과
 * 자리를 바꾸게 된다. 누른 사람 눈에는 아무 일도 일어나지 않은 것처럼 보인다.
 * 그래서 "지금 보이는 목록에서의 이웃"을 찾아 그 둘을 바꾼다.
 *
 * 반환값이 입력과 같은 참조면 바꿀 곳이 없었다는 뜻이다(맨 처음/맨 끝).
 */
export function moveWithinVisible<T>(
  rows: T[],
  visible: T[],
  key: string,
  dir: -1 | 1,
  keyOf: (row: T) => string,
): T[] {
  const vi = visible.findIndex((r) => keyOf(r) === key);
  if (vi < 0) return rows;
  const partner = visible[vi + dir];
  if (!partner) return rows;

  const a = rows.findIndex((r) => keyOf(r) === key);
  const b = rows.findIndex((r) => keyOf(r) === keyOf(partner));
  if (a < 0 || b < 0) return rows;

  const copy = [...rows];
  [copy[a], copy[b]] = [copy[b], copy[a]];
  return copy;
}

/**
 * 손으로 정한 순서를 건드리지 않고 보기만 다르게 하고 싶을 때가 있다
 * (예: 제작 일정을 상태별로 모아 보기).
 *
 * ⚠️ 이건 **보기 전용**이다. 저장되는 순서는 그대로다. 그래서 이 정렬이 켜져 있는 동안은
 * ↑↓ 를 막아야 한다 — 보이는 자리와 실제 자리가 다른데 자리를 옮기면 결과를 예측할 수 없다.
 */
export function sortForView<T>(rows: T[], order: string[] | null, valueOf: (row: T) => string): T[] {
  if (!order) return rows;
  const rank = new Map(order.map((v, i) => [v, i]));
  return [...rows].sort((a, b) => {
    const ra = rank.get(valueOf(a)) ?? order.length;
    const rb = rank.get(valueOf(b)) ?? order.length;
    return ra - rb;
  });
}

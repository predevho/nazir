export type VisitStats = {
  today: number;
  total: number;
  last7: { day: string; count: number }[];
};

const COOKIE_NAME = 'nz_vid';
const BAR_MIN_PX = 2;

/** 쿠키 문자열에서 방문자 id를 얻거나 새로 만든다. 새로 만들면 setCookie 문자열을 함께 반환. */
export function getOrCreateVisitorId(
  cookieString: string,
  gen: () => string
): { id: string; setCookie: string | null } {
  const existing = cookieString
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (existing) {
    const value = existing.slice(COOKIE_NAME.length + 1);
    if (value) return { id: value, setCookie: null };
  }
  const id = gen();
  const setCookie = `${COOKIE_NAME}=${id}; Max-Age=31536000; Path=/; SameSite=Lax`;
  return { id, setCookie };
}

/** 최근 데이터 막대 높이(px). 최대값이 maxPx, 0은 최소 높이. */
export function barHeights(last7: { day: string; count: number }[], maxPx: number): number[] {
  const max = Math.max(0, ...last7.map((d) => d.count));
  if (max === 0) return last7.map(() => BAR_MIN_PX);
  return last7.map((d) => (d.count === 0 ? BAR_MIN_PX : Math.max(BAR_MIN_PX, Math.round((d.count / max) * maxPx))));
}

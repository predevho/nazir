import { describe, it, expect } from 'vitest';
import { getOrCreateVisitorId, barHeights } from './visits';

describe('getOrCreateVisitorId', () => {
  it('쿠키에 nz_vid가 있으면 그 값을 쓰고 setCookie는 null', () => {
    const r = getOrCreateVisitorId('a=1; nz_vid=abc123xyz; b=2', () => 'NEW');
    expect(r).toEqual({ id: 'abc123xyz', setCookie: null });
  });
  it('없으면 생성값을 쓰고 setCookie 문자열을 만든다', () => {
    const r = getOrCreateVisitorId('', () => 'GEN-UUID-VALUE');
    expect(r.id).toBe('GEN-UUID-VALUE');
    expect(r.setCookie).toContain('nz_vid=GEN-UUID-VALUE');
    expect(r.setCookie).toContain('SameSite=Lax');
    expect(r.setCookie).toContain('Max-Age=');
  });
  it('nz_vid 값이 비어 있으면 새로 생성한다', () => {
    const r = getOrCreateVisitorId('nz_vid=; x=1', () => 'GEN');
    expect(r.id).toBe('GEN');
    expect(r.setCookie).toContain('nz_vid=GEN');
  });
});

describe('barHeights', () => {
  it('최대값이 maxPx가 되도록 비례 축소, 0은 최소 높이', () => {
    expect(barHeights([{ day: '01', count: 0 }, { day: '02', count: 5 }, { day: '03', count: 10 }], 40)).toEqual([2, 20, 40]);
  });
  it('전부 0이면 모두 최소 높이', () => {
    expect(barHeights([{ day: '01', count: 0 }, { day: '02', count: 0 }], 40)).toEqual([2, 2]);
  });
  it('빈 배열은 빈 결과', () => {
    expect(barHeights([], 40)).toEqual([]);
  });
});

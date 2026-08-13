import { describe, it, expect } from 'vitest';
import { computeTargetSize } from './resize';

describe('computeTargetSize', () => {
  it('긴 변이 max를 넘으면 비율을 유지하며 축소한다(가로가 김)', () => {
    expect(computeTargetSize(3000, 2000, 1200)).toEqual({ width: 1200, height: 800 });
  });
  it('세로가 긴 경우도 긴 변 기준으로 축소한다', () => {
    expect(computeTargetSize(2000, 4000, 1200)).toEqual({ width: 600, height: 1200 });
  });
  it('정사각은 max x max로 축소한다', () => {
    expect(computeTargetSize(2400, 2400, 1200)).toEqual({ width: 1200, height: 1200 });
  });
  it('긴 변이 max 이하이면 원본 크기를 유지한다(확대 금지)', () => {
    expect(computeTargetSize(800, 600, 1200)).toEqual({ width: 800, height: 600 });
  });
  it('결과 크기는 정수로 반올림한다', () => {
    expect(computeTargetSize(1000, 333, 1200)).toEqual({ width: 1000, height: 333 });
    expect(computeTargetSize(2500, 833, 1200)).toEqual({ width: 1200, height: 400 });
  });
});

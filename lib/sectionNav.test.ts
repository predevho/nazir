import { describe, it, expect } from 'vitest';
import { getNeighbors, readSwipe, SWIPE_MIN_DISTANCE } from './sectionNav';
import { ABOUT_SECTIONS } from '../content/about';

describe('getNeighbors', () => {
  it('gives both sides in the middle', () => {
    const n = getNeighbors(ABOUT_SECTIONS, 'praysound', '/about');
    expect(n.prev?.href).toBe('/about/greeting');
    expect(n.next?.href).toBe('/about/work');
    expect(n.prev?.label).toBe('01 연출의 인사말');
  });

  it('drops prev on the first page and next on the last', () => {
    expect(getNeighbors(ABOUT_SECTIONS, 'greeting', '/about').prev).toBeUndefined();
    expect(getNeighbors(ABOUT_SECTIONS, 'characters', '/about').next).toBeUndefined();
  });

  it('returns nothing for an unknown slug rather than guessing', () => {
    expect(getNeighbors(ABOUT_SECTIONS, 'nope', '/about')).toEqual({});
  });
});

describe('readSwipe', () => {
  it('reads a left drag as the next page — 종이를 넘기는 방향', () => {
    expect(readSwipe(-120, 5)).toBe('next');
  });

  it('reads a right drag as the previous page', () => {
    expect(readSwipe(120, -5)).toBe('prev');
  });

  it('ignores a drag too short to be intentional', () => {
    expect(readSwipe(-(SWIPE_MIN_DISTANCE - 1), 0)).toBeNull();
  });

  it('ignores a mostly vertical drag so scrolling is not hijacked', () => {
    // 아래로 훑으면서 손가락이 좌우로 흔들린 경우
    expect(readSwipe(-80, 200)).toBeNull();
    expect(readSwipe(-80, -200)).toBeNull();
  });

  it('still accepts a diagonal drag that is clearly horizontal', () => {
    expect(readSwipe(-200, 60)).toBe('next');
  });
});

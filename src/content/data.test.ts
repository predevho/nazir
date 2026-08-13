import { describe, it, expect } from 'vitest';
import { content } from './data';

describe('content data', () => {
  it('has 6 characters', () => { expect(content.characters).toHaveLength(6); });
  it('has 20 timeline events', () => { expect(content.timeline).toHaveLength(20); });
  it('has 8 budget items', () => { expect(content.budget).toHaveLength(8); });
  it('has 6 prayers', () => { expect(content.prayers).toHaveLength(6); });
  it('has 3 people groups', () => { expect(content.people).toHaveLength(3); });
  it('has the kakaobank account number', () => { expect(content.site.accountNumber).toBe('3333-23-3584437'); });
  it('keeps timeline items ordered by sortOrder', () => {
    const orders = content.timeline.map((t) => t.sortOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

import { describe, it, expect } from 'vitest';
import type { TimelineEvent } from './types';

describe('content types', () => {
  it('accepts a valid timeline status', () => {
    const e: TimelineEvent = { id: '1', period: '26.01', title: '대본', status: '완료', sortOrder: 0 };
    expect(e.status).toBe('완료');
  });
});

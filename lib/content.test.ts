import { describe, it, expect } from 'vitest';
import { getContent } from './content';

describe('getContent', () => {
  it('resolves with the full content payload', async () => {
    const data = await getContent();
    expect(data.characters).toHaveLength(6);
    expect(data.site.accountNumber).toBe('3333-23-3584437');
  });
});

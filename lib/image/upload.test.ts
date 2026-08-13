import { describe, it, expect } from 'vitest';
import { photoPath } from './upload';

describe('photoPath', () => {
  it('등장인물은 characters/{id}.webp 경로를 만든다', () => {
    expect(photoPath('characters', 'abc-123')).toBe('characters/abc-123.webp');
  });
  it('참여자는 people/{id}.webp 경로를 만든다', () => {
    expect(photoPath('people', 'g1m0')).toBe('people/g1m0.webp');
  });
});

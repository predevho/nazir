import { describe, it, expect } from 'vitest';
import { ADMIN_FIELDS } from './adminFields';
import { content } from '@/content/data';

describe('ADMIN_FIELDS', () => {
  it('SiteContent의 문자열 필드(facts 제외)를 정확히 모두 덮는다', () => {
    const siteKeys = Object.keys(content.site).filter((k) => k !== 'facts').sort();
    const fieldKeys = ADMIN_FIELDS.map((f) => f.key).sort();
    expect(fieldKeys).toEqual(siteKeys);
  });
  it('키 중복이 없다', () => {
    const keys = ADMIN_FIELDS.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

import { describe, it, expect } from 'vitest';
import { pageMeta, OG_BASE } from './pageMeta';

describe('pageMeta', () => {
  it('declares the page as its own canonical', () => {
    expect(pageMeta('/join/support').alternates).toEqual({ canonical: '/join/support' });
  });

  it('points og:url at the page, not the home page', () => {
    // 후원 페이지를 카톡에 붙여넣었을 때 카드가 홈으로 가면 안 된다
    expect(pageMeta('/join/support').openGraph?.url).toBe('/join/support');
  });

  it('carries the shared og:image along, since Next replaces openGraph wholesale', () => {
    const og = pageMeta('/guestbook').openGraph;
    expect(og?.images).toEqual(OG_BASE.images);
    expect(og?.siteName).toBe('나지르');
    expect(og?.locale).toBe('ko_KR');
  });

  it('keeps paths relative so metadataBase can expand them', () => {
    // 절대 URL을 박아 두면 도메인이 바뀔 때 여기까지 고쳐야 한다
    expect(pageMeta('/people').openGraph?.url).not.toMatch(/^https?:/);
  });
});

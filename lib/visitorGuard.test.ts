import { describe, it, expect } from 'vitest';
import { isBotUserAgent } from './visitorGuard';

describe('isBotUserAgent', () => {
  it('빈 UA는 봇으로 취급', () => {
    expect(isBotUserAgent('')).toBe(true);
    expect(isBotUserAgent('   ')).toBe(true);
  });
  it('알려진 봇/스크립트는 true', () => {
    expect(isBotUserAgent('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true);
    expect(isBotUserAgent('python-requests/2.31.0')).toBe(true);
    expect(isBotUserAgent('curl/8.4.0')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (compatible; bingbot/2.0)')).toBe(true);
    expect(isBotUserAgent('HeadlessChrome/120.0')).toBe(true);
  });
  it('실제 브라우저 UA는 false', () => {
    expect(isBotUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')).toBe(false);
    expect(isBotUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')).toBe(false);
  });
});

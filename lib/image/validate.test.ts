import { describe, it, expect } from 'vitest';
import {
  checkImageFile,
  checkImageSize,
  decodeErrorMessage,
  MAX_INPUT_BYTES,
  MAX_INPUT_PIXELS,
} from './validate';

const file = (type: string, size = 1024) => ({ type, size });

describe('checkImageFile', () => {
  it('accepts the formats a browser canvas can reliably re-encode', () => {
    for (const t of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
      expect(checkImageFile(file(t)).ok).toBe(true);
    }
  });

  it('lets HEIC through so the decode step can explain itself', () => {
    // 아이폰 사파리는 열 수 있고, 못 여는 브라우저는 decodeErrorMessage 가 안내한다
    expect(checkImageFile(file('image/heic')).ok).toBe(true);
  });

  it('rejects SVG — canvas 결과가 브라우저마다 다르다', () => {
    const r = checkImageFile(file('image/svg+xml'));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/JPG/);
  });

  it('rejects a non-image masquerading through the picker', () => {
    expect(checkImageFile(file('application/pdf')).ok).toBe(false);
    expect(checkImageFile(file('')).ok).toBe(false);
  });

  it('rejects a file over the size cap and says how big it was', () => {
    const r = checkImageFile(file('image/jpeg', MAX_INPUT_BYTES + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/15\.0MB 이하/);
  });

  it('accepts a file sitting exactly on the cap', () => {
    expect(checkImageFile(file('image/jpeg', MAX_INPUT_BYTES)).ok).toBe(true);
  });
});

describe('checkImageSize', () => {
  it('accepts an ordinary phone photo', () => {
    expect(checkImageSize(4032, 3024).ok).toBe(true);
  });

  it('rejects an image that would blow up the canvas', () => {
    const r = checkImageSize(20000, 20000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/20000×20000/);
  });

  it('accepts right at the pixel ceiling', () => {
    expect(checkImageSize(MAX_INPUT_PIXELS / 1000, 1000).ok).toBe(true);
  });
});

describe('decodeErrorMessage', () => {
  it('names HEIC specifically since that is the common iPhone case', () => {
    expect(decodeErrorMessage('image/heic')).toMatch(/HEIC/);
    expect(decodeErrorMessage('image/heif')).toMatch(/HEIC/);
  });

  it('falls back to a generic message otherwise', () => {
    expect(decodeErrorMessage('image/png')).toMatch(/읽지 못했습니다/);
  });
});

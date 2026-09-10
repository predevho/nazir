import { describe, it, expect } from 'vitest';
import {
  checkSubmission,
  noteStyle,
  formatNoteDate,
  resolvePage,
  MESSAGE_MAX,
  NAME_MAX,
  PAGE_SIZE,
} from './guestbook';

const valid = { name: '정은수', message: '응원합니다', honeypot: '', elapsedMs: 5000 };

describe('checkSubmission', () => {
  it('accepts an ordinary submission', () => {
    expect(checkSubmission(valid)).toEqual({ ok: true });
  });

  it('rejects a filled honeypot before looking at anything else', () => {
    expect(checkSubmission({ ...valid, honeypot: 'http://spam' })).toEqual({
      ok: false,
      reason: 'honeypot',
    });
  });

  it('rejects a submission faster than a person could type', () => {
    expect(checkSubmission({ ...valid, elapsedMs: 900 })).toEqual({ ok: false, reason: 'tooFast' });
  });

  it('rejects a missing elapsed time rather than trusting it', () => {
    expect(checkSubmission({ ...valid, elapsedMs: undefined })).toEqual({
      ok: false,
      reason: 'tooFast',
    });
  });

  it('rejects a blank or overlong name', () => {
    expect(checkSubmission({ ...valid, name: '   ' })).toEqual({ ok: false, reason: 'name' });
    expect(checkSubmission({ ...valid, name: 'ㄱ'.repeat(NAME_MAX + 1) })).toEqual({
      ok: false,
      reason: 'name',
    });
  });

  it('rejects a blank or overlong message', () => {
    expect(checkSubmission({ ...valid, message: '' })).toEqual({ ok: false, reason: 'message' });
    expect(checkSubmission({ ...valid, message: 'ㄱ'.repeat(MESSAGE_MAX + 1) })).toEqual({
      ok: false,
      reason: 'message',
    });
  });

  it('allows a message that sits exactly on the limit', () => {
    expect(checkSubmission({ ...valid, message: 'ㄱ'.repeat(MESSAGE_MAX) })).toEqual({ ok: true });
  });
});

describe('noteStyle', () => {
  it('alternates the sheet-music background and the tape angle (comment #43)', () => {
    expect(noteStyle(0)).toEqual({ background: '/images/note-square.webp', tapeAngle: 8 });
    expect(noteStyle(1)).toEqual({ background: '/images/note-wide.webp', tapeAngle: -8 });
    expect(noteStyle(2)).toEqual(noteStyle(0));
  });
});

describe('resolvePage', () => {
  it('reports a single page when everything fits', () => {
    expect(resolvePage(undefined, PAGE_SIZE)).toEqual({ page: 1, totalPages: 1 });
  });

  it('reports a single page when the board is empty', () => {
    expect(resolvePage(undefined, 0)).toEqual({ page: 1, totalPages: 1 });
  });

  it('splits into pages once it overflows', () => {
    expect(resolvePage('2', PAGE_SIZE + 1)).toEqual({ page: 2, totalPages: 2 });
  });

  it('falls back to the first page for junk instead of 404ing', () => {
    for (const bad of ['abc', '0', '-3', '1.5', '', null]) {
      expect(resolvePage(bad, PAGE_SIZE * 3).page).toBe(1);
    }
  });

  it('falls back when the page is past the end', () => {
    expect(resolvePage('9', PAGE_SIZE + 1).page).toBe(1);
  });

  it('takes the first value when the query repeats', () => {
    expect(resolvePage(['2', '3'], PAGE_SIZE * 3).page).toBe(2);
  });
});

describe('formatNoteDate', () => {
  it('formats as the design does', () => {
    expect(formatNoteDate('2026-08-26T01:02:03.000Z')).toMatch(/^2026\.08\.2[56]$/);
  });
  it('returns an empty string for junk instead of throwing', () => {
    expect(formatNoteDate('nope')).toBe('');
  });
});

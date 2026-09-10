import { describe, it, expect } from 'vitest';
import { checkSubmission, noteStyle, formatNoteDate, MESSAGE_MAX, NAME_MAX } from './guestbook';

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

describe('formatNoteDate', () => {
  it('formats as the design does', () => {
    expect(formatNoteDate('2026-08-26T01:02:03.000Z')).toMatch(/^2026\.08\.2[56]$/);
  });
  it('returns an empty string for junk instead of throwing', () => {
    expect(formatNoteDate('nope')).toBe('');
  });
});

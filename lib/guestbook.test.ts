import { describe, it, expect } from 'vitest';
import {
  checkReply,
  groupRepliesByEntry,
  REPLY_MAX,
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

describe('groupRepliesByEntry', () => {
  const reply = (id: string, entryId: string) => ({
    id, entryId, message: '고맙습니다', createdAt: '2026-08-27T04:00:00.000Z',
  });

  it('묶어서 원글 id 로 꺼낼 수 있게 한다', () => {
    const byEntry = groupRepliesByEntry([reply('r1', 'e1'), reply('r2', 'e2'), reply('r3', 'e1')]);
    expect(byEntry.get('e1')?.map((r) => r.id)).toEqual(['r1', 'r3']);
    expect(byEntry.get('e2')?.map((r) => r.id)).toEqual(['r2']);
  });

  it('답글이 없는 글은 아예 없는 키다 — 화면에서 빈 배열로 받는다', () => {
    expect(groupRepliesByEntry([]).get('e1')).toBeUndefined();
  });

  it('넘어온 순서를 지킨다. 정렬은 질의가 맡는다', () => {
    const byEntry = groupRepliesByEntry([reply('b', 'e1'), reply('a', 'e1')]);
    expect(byEntry.get('e1')?.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('checkReply', () => {
  it('앞뒤 공백을 털고 통과시킨다', () => {
    expect(checkReply('  고맙습니다  ')).toEqual({ ok: true, message: '고맙습니다' });
  });

  it('빈 답글은 막는다 — 공백만 있는 경우도', () => {
    expect(checkReply('')).toEqual({ ok: false, reason: 'empty' });
    expect(checkReply('   ')).toEqual({ ok: false, reason: 'empty' });
    expect(checkReply(undefined)).toEqual({ ok: false, reason: 'empty' });
  });

  it('본문과 같은 길이로 묶는다 — 쪽지 아래 자리라 더 길면 원글을 덮는다', () => {
    expect(checkReply('가'.repeat(REPLY_MAX)).ok).toBe(true);
    expect(checkReply('가'.repeat(REPLY_MAX + 1))).toEqual({ ok: false, reason: 'long' });
  });
});
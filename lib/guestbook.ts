export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export const NAME_MAX = 20;
export const MESSAGE_MAX = 300;
/** 사람이 이름·메시지를 채우는 데 걸리는 최소 시간. 이보다 빠르면 자동 제출로 본다. */
export const MIN_FILL_MS = 3000;

export type SubmitCheck =
  | { ok: true }
  | { ok: false; reason: 'name' | 'message' | 'honeypot' | 'tooFast' };

/**
 * 서버에서 돌리는 1차 검사. 길이 + 봇 대응 2종(허니팟, 제출 시간)이다.
 * 레이트 리밋과 링크 보류는 DB 함수(`submit_guestbook_entry`)가 맡는다
 * — docs/decisions.md C-4.
 */
export function checkSubmission(input: {
  name: unknown;
  message: unknown;
  honeypot: unknown;
  elapsedMs: unknown;
}): SubmitCheck {
  // 봇이 채워 넣는 숨은 칸. 값이 있으면 사람이 아니다.
  if (typeof input.honeypot === 'string' && input.honeypot.trim() !== '') {
    return { ok: false, reason: 'honeypot' };
  }
  if (typeof input.elapsedMs !== 'number' || !Number.isFinite(input.elapsedMs)) {
    return { ok: false, reason: 'tooFast' };
  }
  if (input.elapsedMs < MIN_FILL_MS) return { ok: false, reason: 'tooFast' };

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name === '' || name.length > NAME_MAX) return { ok: false, reason: 'name' };

  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (message === '' || message.length > MESSAGE_MAX) return { ok: false, reason: 'message' };

  return { ok: true };
}

/**
 * 시안은 쪽지 배경으로 정사각형·직사각형 악보를 번갈아 쓰고,
 * 테이프를 8° / −8°로 교대해 붙인다 (코멘트 #43).
 */
export function noteStyle(index: number): { background: string; tapeAngle: number } {
  return {
    background: index % 2 === 0 ? '/images/note-square.webp' : '/images/note-wide.webp',
    tapeAngle: index % 2 === 0 ? 8 : -8,
  };
}

/** 쪽지 우하단 날짜. 시안 표기는 `2026.08.26`. */
export function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

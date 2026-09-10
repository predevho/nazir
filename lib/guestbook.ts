export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

/**
 * 운영진이 응원글에 다는 답글 (명세 44·45행).
 * 누구나 다는 것이 아니라 운영진만 쓴다 — docs/decisions.md C-2.
 * 그래서 작성자 이름 칸이 없다. 화면에서는 늘 "제작팀"으로 밝힌다.
 */
export interface GuestbookReply {
  id: string;
  entryId: string;
  message: string;
  createdAt: string;
}

export const NAME_MAX = 20;
export const MESSAGE_MAX = 300;
/** 답글도 본문과 같은 길이로 묶는다. 쪽지 아래 붙는 자리라 더 길면 원글을 덮는다. */
export const REPLY_MAX = 300;

/** 답글 목록을 원글 id 별로 묶는다. 한 글에 여러 개가 붙을 수 있다(1:N). */
export function groupRepliesByEntry(replies: GuestbookReply[]): Map<string, GuestbookReply[]> {
  const byEntry = new Map<string, GuestbookReply[]>();
  for (const reply of replies) {
    const list = byEntry.get(reply.entryId);
    if (list) list.push(reply);
    else byEntry.set(reply.entryId, [reply]);
  }
  return byEntry;
}

/** 저장 전 마지막 관문. 서버 액션과 테스트가 같은 규칙을 본다. */
export function checkReply(message: unknown): { ok: true; message: string } | { ok: false; reason: 'empty' | 'long' } {
  const text = typeof message === 'string' ? message.trim() : '';
  if (text === '') return { ok: false, reason: 'empty' };
  if (text.length > REPLY_MAX) return { ok: false, reason: 'long' };
  return { ok: true, message: text };
}
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
export function noteStyle(index: number): NoteStyle {
  return index % 2 === 0
    ? { background: '/images/note-square.webp', slice: '72 44 92 44', border: '30px 22px 38px 22px', tapeAngle: 8 }
    : { background: '/images/note-wide.webp', slice: '80 50 100 50', border: '30px 20px 38px 20px', tapeAngle: -8 };
}

/**
 * 쪽지 배경은 찢어진 악보 비트맵이다. 답글이 붙어 종이가 길어져야 하는데,
 * `background-size: 100% 100%` 로 늘리면 악보 오선 간격이 벌어지고 찢어진 가장자리가
 * 같이 늘어나 눈에 띄게 어색해진다 — docs/decisions.md C-2.
 *
 * 그래서 `border-image` 로 같은 이미지를 9칸으로 잘라 쓴다. 네 모서리와 가장자리는
 * 그대로 두고 가운데만 반복시키므로 높이가 변해도 종이 질감이 유지된다.
 * `slice` 는 원본 픽셀 기준 자르는 위치, `border` 는 화면에서 그 조각이 차지할 두께다.
 *
 * 이 방법이면 디자이너에게 3분할 이미지를 따로 받을 필요가 없다.
 */
export interface NoteStyle {
  background: string;
  /** border-image-slice — 원본 이미지에서 자를 위치(px) */
  slice: string;
  /** border-width — 잘린 조각이 화면에서 차지할 두께 */
  border: string;
  tapeAngle: number;
}

/** 한 페이지에 깔리는 쪽지 수. 시안 그리드가 4열이라 4의 배수로 둔다. */
export const PAGE_SIZE = 24;

/**
 * `?page=` 값을 실제로 보여줄 페이지로 정리한다.
 * 글자·음수·범위 밖 값은 조용히 1페이지로 떨어뜨린다.
 */
export function resolvePage(raw: unknown, total: number): { page: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isInteger(n) || n < 1 || n > totalPages) return { page: 1, totalPages };
  return { page: n, totalPages };
}

/** 쪽지 우하단 날짜. 시안 표기는 `2026.08.26`. */
export function formatNoteDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/**
 * 응원글 1차 선별. 욕설·광고·도배 신호를 찾아 **보류 대상인지**만 정한다.
 *
 * 여기서 무엇도 거절하지 않는다. 판정 결과는 `is_held` 하나로만 쓰이고,
 * 보류된 글은 사라지지 않고 운영진 검토 큐로 간다. 오탐이 나도 한 번 눌러
 * 공개하면 끝이라, 애매하면 걸러내는 쪽으로 기울여도 안전하다
 * — docs/decisions.md C-4.
 *
 * 규칙 기반은 우회가 쉽다(`ㅅㅂ`, `시1발`, `쿄톡`). 완벽한 차단 장치가 아니라
 * **사람이 볼 큐로 보내는 장치**로 쓴다. 나중에 AI 판정을 얹을 때는
 * `screenMessage` 를 통과한 글만 넘기면 호출량이 그만큼 줄어든다.
 */

export type HoldReason = 'link' | 'profanity' | 'contact' | 'promo' | 'flood';

export interface ModerationVerdict {
  hold: boolean;
  reasons: HoldReason[];
}

/** 운영진 화면에 그대로 띄우는 설명. 코드값만 보면 왜 걸렸는지 알기 어렵다. */
export const HOLD_REASON_LABEL: Record<HoldReason, string> = {
  link: '링크 포함',
  profanity: '욕설로 보이는 표현',
  contact: '연락처·아이디',
  promo: '광고성 문구',
  flood: '같은 글자·문구 반복',
};

/**
 * 비교용 정규화는 **두 가지**다. 하나로 합치면 서로를 망가뜨린다.
 *
 * `compactForMatch` — 사이에 낀 공백·기호를 없애고 소문자로 눕힌다.
 *   숫자는 건드리지 않는다. 전화번호·아이디를 찾으려면 숫자가 살아 있어야 한다.
 *   (`010-1234-5678` → `01012345678`)
 *
 * `normalizeForMatch` — 위에 더해, 글자 대신 쓴 숫자를 되돌린다 (`sp4m` → `spam`).
 *   낱말 매칭 전용이다. 이걸 번호 탐지에 쓰면 `0`·`1` 이 `o`·`l` 로 바뀌어
 *   `010-1234-5678` 이 `olol234s678` 이 된다 — 실제로 그렇게 새고 있었다.
 *
 * 둘 다 3번 이상 반복을 2번으로 줄인다 (`ㅋㅋㅋㅋㅋ` → `ㅋㅋ`).
 * 도배 판정만은 원문으로 본다 — 정규화가 반복을 이미 지워 버리기 때문이다.
 */
const DIGIT_LOOKALIKE: Record<string, string> = { '0': 'o', '1': 'l', '3': 'e', '4': 'a', '5': 's', '7': 't' };

export function compactForMatch(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\s.,_\-*~^!?'"()[\]{}<>/\\|+=]/g, '')
    .replace(/(.)\1{2,}/g, '$1$1');
}

export function normalizeForMatch(raw: string): string {
  return compactForMatch(raw).replace(/[013457]/g, (d) => DIGIT_LOOKALIKE[d] ?? d);
}

/**
 * 욕설. **낱말 전체**만 넣는다. `개` 같은 조각을 넣으면 개발·개막·개선이 전부 걸린다.
 * 자모 축약(`ㅅㅂ`, `ㅄ`)은 따로 둔다 — 정규화해도 원래 낱말로 돌아가지 않는다.
 */
const PROFANITY = [
  '시발', '씨발', '씨팔', '시팔', '개새끼', '개색기', '새끼', '병신', '지랄',
  '좆', '존나', '졸라', '미친놈', '미친년', '꺼져', '닥쳐', '엿먹어', '개소리',
  '등신', '멍청이', '또라이', '호로', '썅', '쌍놈', 'níg',
];

/** 자모만 남긴 축약형. 본문에 그대로 있을 때만 본다. */
const PROFANITY_JAMO = ['ㅅㅂ', 'ㅆㅂ', 'ㅄ', 'ㅂㅅ', 'ㅈㄹ', 'ㄷㅊ', 'ㄲㅈ', 'ㅁㅊ'];

/**
 * 욕설처럼 보이지만 멀쩡한 낱말. 여기 걸리면 욕설 판정에서 빼 준다.
 * `시발점`·`시발역`은 始發 이고, `새끼발가락`은 신체 부위다.
 */
const PROFANITY_EXCEPTIONS = ['시발점', '시발역', '시발자', '새끼발가락', '새끼손가락'];

/**
 * 연락처. 광고의 가장 흔한 꼬리표다.
 *
 * 낱말만으로 거는 것과 아이디가 붙어야 거는 것을 나눈다.
 * `카톡`·`라인`은 응원글에도 자연스럽게 나온다("카톡 프로필에 걸어놨어요").
 * 뒤에 아이디처럼 생긴 토큰이 붙을 때만 본다.
 * 반면 `오픈채팅`·`텔레그램`은 이 게시판에 나올 이유가 거의 없어 낱말만으로 건다.
 */
const CONTACT_PATTERNS: RegExp[] = [
  // 010-1234-5678 / 01012345678 / 010 1234 5678 (붙여 놓은 뒤라 이어져 있다)
  /01[016789]\d{7,8}/,
  // 아이디가 붙어야 거는 것
  /(카톡|카카오톡|라인|오픈톡)(아이디|id)?[:@＠]?[a-z0-9_]{3,}/i,
  // 낱말만으로 거는 것
  /(오픈채팅|텔레그램|텔레그람|디엠주세요)/,
  // @아이디 표기
  /@[a-z0-9_]{4,}/i,
];

/** 광고 문구. 응원 게시판에 올 이유가 없는 말들이다. */
const PROMO_PATTERNS: RegExp[] = [
  /(부업|재택|알바문의|고수익|월수익|투잡)/,
  /(대출|신용대출|일수|급전|채무)/,
  /(토토|카지노|바카라|슬롯|배팅|베팅|먹튀)/,
  /(코인|비트코인|리딩방|수익인증|투자문의|주식리딩)/,
  /(홍보|광고문의|제휴문의|디비판매|db판매)/,
  /(성인|야동|조건만남)/,
];

/** 링크. DB 함수에도 같은 규칙이 있지만, 여기서도 이유를 남기려고 다시 본다. */
const LINK_PATTERN = /(https?:\/\/|www\.|\.com|\.net|\.kr\/|\.io\/|\.me\/|t\.me)/i;

/**
 * 도배. 원문 기준으로 본다 — 정규화가 반복을 이미 줄여 버리기 때문이다.
 * `ㅋㅋㅋㅋ` 정도는 응원에서 흔하므로 넉넉히 잡는다.
 */
const FLOOD_RUN = 8; // 같은 글자가 연속 8번 이상
const FLOOD_REPEAT = 4; // 같은 낱말이 4번 이상

function looksFlooded(raw: string): boolean {
  if (new RegExp(`(.)\\1{${FLOOD_RUN - 1},}`).test(raw)) return true;

  const words = raw.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length >= FLOOD_REPEAT) {
    const counts = new Map<string, number>();
    for (const w of words) {
      const n = (counts.get(w) ?? 0) + 1;
      if (n >= FLOOD_REPEAT) return true;
      counts.set(w, n);
    }
  }
  return false;
}

function hasProfanity(raw: string, normalized: string): boolean {
  // 예외 낱말은 지운 뒤에 본다. `시발점`이 `시발`로 걸리면 안 된다.
  let text = normalized;
  for (const safe of PROFANITY_EXCEPTIONS) {
    text = text.split(normalizeForMatch(safe)).join('');
  }
  if (PROFANITY.some((word) => text.includes(normalizeForMatch(word)))) return true;
  // 자모 축약은 정규화가 되돌리지 못하므로 원문에서 본다.
  return PROFANITY_JAMO.some((jamo) => raw.includes(jamo));
}

/**
 * 한 건을 훑어 보류 사유를 모은다. 사유가 하나도 없으면 바로 공개된다.
 *
 * 나중에 AI 판정을 붙일 자리: 여기서 `hold === false` 로 나온 글만 모델에 넘기면 된다.
 * 모델 호출이 실패하면 그때도 보류로 보낸다 — 글을 잃는 것보다 낫다.
 */
export function screenMessage(raw: unknown): ModerationVerdict {
  const text = typeof raw === 'string' ? raw : '';
  if (text.trim() === '') return { hold: false, reasons: [] };

  const compact = compactForMatch(text);
  const normalized = normalizeForMatch(text);
  const reasons: HoldReason[] = [];

  if (LINK_PATTERN.test(text) || LINK_PATTERN.test(compact)) reasons.push('link');
  if (hasProfanity(text, normalized)) reasons.push('profanity');
  // 연락처는 숫자가 살아 있는 쪽으로 본다.
  if (CONTACT_PATTERNS.some((p) => p.test(compact))) reasons.push('contact');
  if (PROMO_PATTERNS.some((p) => p.test(normalized))) reasons.push('promo');
  if (looksFlooded(text)) reasons.push('flood');

  return { hold: reasons.length > 0, reasons };
}

/** 운영진 화면용 한 줄 설명. */
export function describeHold(reasons: HoldReason[]): string {
  return reasons.map((r) => HOLD_REASON_LABEL[r]).join(' · ');
}

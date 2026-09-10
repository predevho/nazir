import { describe, it, expect } from 'vitest';
import { screenMessage, normalizeForMatch, describeHold } from './moderation';

const held = (text: string) => screenMessage(text);

describe('screenMessage — 통과해야 하는 진짜 응원글', () => {
  const real = [
    '화이팅!',
    '공연 잘 준비되길 기도합니다. 꼭 보러 갈게요!',
    '연습하느라 고생 많으셨죠? ㅋㅋ 무대에서 빛나실 거예요',
    '나지르 대박나세요~~ 응원합니다 ♥',
    '개막 축하드립니다. 좋은 무대 기대할게요',
    '개발팀도 고생하셨습니다',
    '시발점이 된 그 순간부터 응원했습니다',
    '새끼발가락까지 힘주고 응원 중입니다',
    '기도로 함께하겠습니다. 모든 필요가 채워지기를!',
    'ㅠㅠ 너무 감동이에요',
  ];

  for (const text of real) {
    it(`통과: "${text.slice(0, 24)}"`, () => {
      const v = held(text);
      expect(v.reasons).toEqual([]);
      expect(v.hold).toBe(false);
    });
  }
});

describe('screenMessage — 욕설', () => {
  it('그대로 쓴 욕설을 잡는다', () => {
    expect(held('시발 뭐야').reasons).toContain('profanity');
    expect(held('병신같네').reasons).toContain('profanity');
  });

  it('사이에 공백·기호를 끼워 넣어도 잡는다', () => {
    expect(held('시 발').reasons).toContain('profanity');
    expect(held('시.발').reasons).toContain('profanity');
    expect(held('개-새끼').reasons).toContain('profanity');
  });

  it('자모 축약도 잡는다', () => {
    expect(held('ㅅㅂ 진짜').reasons).toContain('profanity');
    expect(held('ㅄ아').reasons).toContain('profanity');
  });

  it('멀쩡한 낱말은 걸지 않는다 — 오탐이 제일 아프다', () => {
    // 始發점 / 새끼발가락. 조각 매칭이면 여기서 터진다.
    expect(held('시발점').reasons).not.toContain('profanity');
    expect(held('새끼발가락').reasons).not.toContain('profanity');
    expect(held('개발 잘 되길').reasons).not.toContain('profanity');
    expect(held('개막 축하해요').reasons).not.toContain('profanity');
  });
});

describe('screenMessage — 광고', () => {
  it('전화번호를 잡는다', () => {
    expect(held('문의 010-1234-5678').reasons).toContain('contact');
    expect(held('01012345678 연락주세요').reasons).toContain('contact');
    expect(held('010 1234 5678').reasons).toContain('contact');
  });

  it('카톡·텔레그램 아이디 안내를 잡는다', () => {
    expect(held('카톡 abc123 으로 연락주세요').reasons).toContain('contact');
    expect(held('텔레그램 @spamking 문의').reasons).toContain('contact');
    expect(held('오픈채팅방에서 봬요').reasons).toContain('contact');
  });

  it('아이디 없이 카톡만 말하는 진짜 응원은 통과시킨다', () => {
    // 낱말만으로 걸면 "카톡 프로필에 걸어놨어요" 같은 응원이 매번 보류된다.
    expect(held('카톡 프로필에 걸어놨어요').reasons).not.toContain('contact');
    expect(held('라인으로 소식 받아볼게요').reasons).not.toContain('contact');
  });

  it('광고 문구를 잡는다', () => {
    expect(held('부업 문의 받습니다').reasons).toContain('promo');
    expect(held('고수익 알바 구합니다').reasons).toContain('promo');
    expect(held('토토 먹튀 없는 곳').reasons).toContain('promo');
    expect(held('코인 리딩방 수익인증').reasons).toContain('promo');
  });

  it('응원인 척하는 광고도 걸린다 — 실제로 제일 많이 오는 모양', () => {
    const v = held('공연 잘 되길 바랍니다^^ 부업문의 카톡 abc123');
    expect(v.hold).toBe(true);
    expect(v.reasons).toEqual(expect.arrayContaining(['promo', 'contact']));
  });

  it('링크는 사유를 남긴다', () => {
    expect(held('https://spam.example 보세요').reasons).toContain('link');
    expect(held('www.spam.kr/ 방문').reasons).toContain('link');
  });
});

describe('screenMessage — 도배', () => {
  it('같은 글자를 길게 늘이면 잡는다', () => {
    expect(held('ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ').reasons).toContain('flood');
    expect(held('아아아아아아아아아아아').reasons).toContain('flood');
  });

  it('응원에서 흔한 정도는 넘어간다', () => {
    expect(held('화이팅ㅋㅋㅋ').reasons).not.toContain('flood');
    expect(held('축하해요~~~').reasons).not.toContain('flood');
  });

  it('같은 낱말을 되풀이하면 잡는다', () => {
    expect(held('응원 응원 응원 응원 응원').reasons).toContain('flood');
  });
});

describe('normalizeForMatch', () => {
  it('공백·기호를 털고 소문자로 눕힌다', () => {
    expect(normalizeForMatch('Ka Ka-o!')).toBe('kakao');
  });

  it('3번 이상 반복은 2번으로 줄인다 — 도배 판정은 원문으로 따로 본다', () => {
    expect(normalizeForMatch('ㅋㅋㅋㅋㅋ')).toBe('ㅋㅋ');
  });

  it('글자 대신 쓴 숫자를 되돌린다', () => {
    expect(normalizeForMatch('sp4m')).toBe('spam');
  });
});

describe('describeHold', () => {
  it('사유를 사람이 읽을 말로 바꾼다', () => {
    expect(describeHold(['promo', 'contact'])).toBe('광고성 문구 · 연락처·아이디');
  });

  it('사유가 없으면 빈 문자열', () => {
    expect(describeHold([])).toBe('');
  });
});

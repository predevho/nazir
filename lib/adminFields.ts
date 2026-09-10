import type { SiteContent } from '@/content/types';

export type AdminField = {
  key: keyof SiteContent & string;
  label: string;
  multiline?: boolean;
};

/**
 * 이 묶음의 문구가 실제로 나오는 화면들. 관리자가 "이 칸을 고치면 어디가 바뀌지?" 를
 * 묻지 않도록 편집 화면에 링크로 띄운다. 한 묶음이 여러 화면에 걸치는 경우가 있어 배열이다.
 */
export type AdminWhere = { path: string; label: string };

export type AdminSection = { title: string; where: AdminWhere[]; fields: AdminField[] };

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    title: '대하여',
    where: [
      { path: '/about/greeting', label: '대하여 01' },
      { path: '/about/praysound', label: '02' },
      { path: '/about/work', label: '03' },
    ],
    fields: [
      { key: 'aboutGreeting', label: '연출의 인사말', multiline: true },
      { key: 'praysoundStory1', label: 'Praysound 이야기 1', multiline: true },
      { key: 'praysoundStory2', label: 'Praysound 이야기 2', multiline: true },
      { key: 'aboutWork', label: '03 작품 소개 — 왼쪽 설명 (비우면 안 나옵니다)', multiline: true },
      { key: 'aboutCharacters', label: '04 작품 속 인물 — 왼쪽 설명 (비우면 안 나옵니다)', multiline: true },
      { key: 'logline', label: '로그라인', multiline: true },
      { key: 'synopsis', label: '시놉시스', multiline: true },
    ],
  },
  {
    title: '무대에 오르기까지',
    where: [
      { path: '/process/schedule', label: '제작 과정 01' },
      { path: '/process/budget', label: '02' },
      { path: '/people', label: '함께 세우는 사람들' },
    ],
    fields: [
      { key: 'processIntro', label: '안내 문구', multiline: true },
      { key: 'peopleIntro', label: '함께 세우는 사람들 안내', multiline: true },
      { key: 'budgetTotal', label: '제작 예산 총액 (예: ₩ 9,000,000)' },
      { key: 'budgetNote', label: '예산 안내 문구', multiline: true },
    ],
  },
  {
    title: '함께하기',
    where: [
      { path: '/join/support', label: '후원과 기도 01' },
      { path: '/join/prayer', label: '02' },
    ],
    fields: [
      { key: 'joinVerse', label: '성구', multiline: true },
      { key: 'joinVerseRef', label: '성구 출처 (예: 전도서 4:12)' },
      { key: 'joinIntro', label: '01 후원으로 함께하기 — 왼쪽 본문', multiline: true },
      { key: 'supportIntro', label: '후원 안내 문구', multiline: true },
      { key: 'supportFormUrl', label: '후원 신청서 링크 (URL)' },
      { key: 'accountBank', label: '은행명' },
      { key: 'accountNumber', label: '계좌번호' },
      { key: 'accountHolder', label: '예금주 표기 (예: 예금주 정은수)' },
      { key: 'prayerIntro', label: '02 기도로 동참하기 — 왼쪽 본문', multiline: true },
      { key: 'prayerNote', label: '기도 제목 카드 안내 문구', multiline: true },
    ],
  },
  {
    title: '응원 게시판',
    where: [{ path: '/guestbook', label: '응원 게시판' }],
    fields: [{ key: 'guestbookIntro', label: '제목 아래 안내 문구 (줄바꿈 그대로 나갑니다)', multiline: true }],
  },
  {
    title: '푸터 · SNS',
    where: [{ path: '/', label: '모든 화면 아래 푸터' }],
    fields: [
      { key: 'instagramMain', label: '인스타그램 — Pray Sound (URL)' },
      { key: 'instagramMusical', label: '인스타그램 — musical_naz (URL)' },
      { key: 'youtube', label: '유튜브 (URL)' },
      { key: 'contactName', label: '푸터 문의 — 대표 이름' },
      { key: 'contactPhone', label: '푸터 문의 — 연락처' },
    ],
  },
];

export const ADMIN_FIELDS: AdminField[] = ADMIN_SECTIONS.flatMap((s) => s.fields);

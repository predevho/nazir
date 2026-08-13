import type { SiteContent } from '@/content/types';

export type AdminField = {
  key: keyof SiteContent & string;
  label: string;
  multiline?: boolean;
};

export type AdminSection = { title: string; fields: AdminField[] };

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    title: '히어로 (홈)',
    fields: [
      { key: 'heroVerse', label: '상단 성구', multiline: true },
      { key: 'heroSubtitle', label: '부제 (예: 구별된 사람들)' },
      { key: 'heroMeta', label: '제작 정보 (하단, 줄바꿈 가능)', multiline: true },
    ],
  },
  {
    title: '대하여',
    fields: [
      { key: 'aboutGreeting', label: '연출의 인사말', multiline: true },
      { key: 'praysoundStory1', label: 'Praysound 이야기 1', multiline: true },
      { key: 'praysoundStory2', label: 'Praysound 이야기 2', multiline: true },
      { key: 'logline', label: '로그라인', multiline: true },
      { key: 'synopsis', label: '시놉시스', multiline: true },
    ],
  },
  {
    title: '무대에 오르기까지',
    fields: [
      { key: 'processIntro', label: '안내 문구', multiline: true },
      { key: 'peopleIntro', label: '함께 세우는 사람들 안내', multiline: true },
      { key: 'budgetTotal', label: '제작 예산 총액 (예: ₩ 9,000,000)' },
      { key: 'budgetNote', label: '예산 안내 문구', multiline: true },
    ],
  },
  {
    title: '함께하기',
    fields: [
      { key: 'joinVerse', label: '성구', multiline: true },
      { key: 'joinVerseRef', label: '성구 출처 (예: 전도서 4:12)' },
      { key: 'supportIntro', label: '후원 안내 문구', multiline: true },
      { key: 'supportFormUrl', label: '후원 신청서 링크 (URL)' },
      { key: 'accountBank', label: '은행명' },
      { key: 'accountNumber', label: '계좌번호' },
      { key: 'accountHolder', label: '예금주 표기 (예: 예금주 정은수)' },
      { key: 'prayerIntro', label: '기도 안내 문구', multiline: true },
      { key: 'qnaIntro', label: 'Q&A 안내 문구', multiline: true },
      { key: 'qnaUrl', label: 'Q&A 링크 (URL)' },
    ],
  },
  {
    title: '푸터 · SNS',
    fields: [
      { key: 'instagramMain', label: '인스타그램 — Pray Sound (URL)' },
      { key: 'instagramMusical', label: '인스타그램 — 뮤지컬 나지르 (URL)' },
      { key: 'youtube', label: '유튜브 (URL)' },
      { key: 'contactInstagram', label: '문의 인스타그램 (URL)' },
    ],
  },
];

export const ADMIN_FIELDS: AdminField[] = ADMIN_SECTIONS.flatMap((s) => s.fields);

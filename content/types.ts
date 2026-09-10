export type TimelineStatus = '완료' | '진행 중' | '예정';

export interface Character {
  id: string;
  name: string;
  description: string;
  photoUrl: string | null;
  sortOrder: number;
}

export interface TimelineEvent {
  id: string;
  period: string;
  title: string;
  status: TimelineStatus;
  sortOrder: number;
}

export interface BudgetItem {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Prayer {
  id: string;
  text: string;
  sortOrder: number;
}

export interface PeopleMember {
  id: string;
  role: string;
  team: string;
  name: string;
  tagline: string;
  bio: string;
  photoUrl: string | null;
  sortOrder: number;
}

export interface PeopleGroup {
  id: string;
  label: string;
  sortOrder: number;
  members: PeopleMember[];
}

export type AboutLetterSection = 'greeting' | 'praysound';

/**
 * 〈나지르〉에 대하여 01·02의 편지 이미지. 장수는 고정이 아니라 등록한 개수만큼이다.
 * 본문을 이미지가 대신하는 구조라 `caption`(대체 텍스트)이 접근성상 필수다.
 */
export interface AboutLetter {
  id: string;
  section: AboutLetterSection;
  imageUrl: string | null;
  caption: string;
  sortOrder: number;
}

export interface Fact {
  key: string;
  value: string;
}

export interface SiteContent {
  heroVerse: string;
  heroSubtitle: string;
  heroMeta: string;
  aboutGreeting: string;
  praysoundStory1: string;
  praysoundStory2: string;
  logline: string;
  synopsis: string;
  facts: Fact[];
  processIntro: string;
  peopleIntro: string;
  budgetTotal: string;
  budgetNote: string;
  joinVerse: string;
  joinVerseRef: string;
  /** `후원과 기도` 01 좌측 본문 */
  joinIntro: string;
  /** `기도 제목` 카드 상단 안내 문구 */
  prayerNote: string;
  supportIntro: string;
  supportFormUrl: string;
  accountBank: string;
  accountNumber: string;
  accountHolder: string;
  prayerIntro: string;
  qnaIntro: string;
  qnaUrl: string;
  instagramMain: string;
  instagramMusical: string;
  youtube: string;
  contactInstagram: string;
  /** 푸터 `문의` 컬럼. 마스킹하지 않고 시안 그대로 노출한다 — Figma 코멘트 #47(대표 확인 완료). */
  contactName: string;
  contactPhone: string;
}

export interface AllContent {
  site: SiteContent;
  characters: Character[];
  timeline: TimelineEvent[];
  budget: BudgetItem[];
  prayers: Prayer[];
  people: PeopleGroup[];
  letters: AboutLetter[];
}

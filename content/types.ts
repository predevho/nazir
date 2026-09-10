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
  aboutGreeting: string;
  praysoundStory1: string;
  praysoundStory2: string;
  /**
   * 대하여 03·04 의 좌측 설명. 시안이 더미 텍스트라 비워 두었고, 확정 문구가 오면
   * 관리자에서 채운다. 비어 있으면 화면에 아무것도 그리지 않는다(명세 6·7행).
   */
  aboutWork: string;
  aboutCharacters: string;
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
  /**
   * 응원 게시판 제목 아래 안내 문구(명세 6행). 줄바꿈이 그대로 화면에 반영된다.
   *
   * 예전 `qnaIntro`·`qnaUrl` 을 대신한다. Q&A 섹션이 응원 게시판으로 바뀌면서 그 두 칸은
   * 관리자에만 남고 그리는 곳이 없어졌다 — 고쳐도 아무 데도 안 나오는 칸이었다.
   */
  guestbookIntro: string;
  instagramMain: string;
  instagramMusical: string;
  youtube: string;
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

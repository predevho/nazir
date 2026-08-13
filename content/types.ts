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
  name: string;
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
}

export interface AllContent {
  site: SiteContent;
  characters: Character[];
  timeline: TimelineEvent[];
  budget: BudgetItem[];
  prayers: Prayer[];
  people: PeopleGroup[];
}

import type {
  AllContent,
  BudgetItem,
  Character,
  Fact,
  PeopleGroup,
  Prayer,
  TimelineEvent,
  TimelineStatus,
} from './types';

const timelineRows: [string, string, TimelineStatus][] = [
  ['26.01.12 ~ 26.06.28', '대본 작업', '완료'],
  ['26.01.20 ~ 26.06.19', '헤더진 구성 및 팀원 모집', '완료'],
  ['26.01.26 ~ 26.06.16', '뮤지컬 넘버 제작', '완료'],
  ['26.03.12 ~ 26.03.14', '뮤지컬 넘버 가이드 녹음 송캠프', '완료'],
  ['26.04.10', 'SNS 계정 개설 및 홍보', '완료'],
  ['26.04.23 ~ 26.04.24', '1차 배우 오디션', '완료'],
  ['26.04.28 ~ 26.04.30', '1차 교내 장사', '완료'],
  ['26.05.24', '전체 스태프 및 배우 회의', '완료'],
  ['26.05.30', '2차 배우 오디션', '완료'],
  ['26.03.12 ~ 26.07.15', '뮤지컬 넘버 편곡, 악보 채보', '진행 중'],
  ['26.05.25 ~ 26.06.07', '후원처 조사', '진행 중'],
  ['26.07.15 ~ 26.07.18', '뮤지컬 넘버 보컬 본 녹음 송캠프', '예정'],
  ['26.08.04 ~ 26.08.07', '전체 인원 여름 합숙', '예정'],
  ['26.08.09 ~', '배우 연습 시작', '예정'],
  ['26.09.01 ~', '학기 중 배우 연습 진행', '예정'],
  ['26.10', '2차 교내 장사', '예정'],
  ['26.11 ~', '드라이 리허설', '예정'],
  ['26.11.30 ~ 27.01', '티켓 판매 시작', '예정'],
  ['26.12', '전체 인원 겨울 합숙', '예정'],
  ['27.01 또는 27.02', '<나지르> 공연', '예정'],
];

const timeline: TimelineEvent[] = timelineRows.map(([period, title, status], i) => ({
  id: `t${i}`,
  period,
  title,
  status,
  sortOrder: i,
}));

const characterSeeds: { id: string; name: string; description: string }[] = [
  {
    id: 'aron',
    name: '아론',
    description:
      '신앙과 재능 모두 완벽해 보였던 청년. 오디션 탈락 이후 무너진 시간을 지나지만, 자신의 진정한 사명 앞에 다시 돌아오게 된다.',
  },
  {
    id: 'hanna',
    name: '한나',
    description:
      '아론이 졸업 이후 만나게 되는 친구. 소심하고 조용하지만 누구보다 따뜻한 마음씨를 가졌으며, 무너진 아론을 위해 눈물로 기도한다.',
  },
  {
    id: 'nana',
    name: '나나',
    description: '아론이 졸업 이후 만나게 되는 친구. 밝고 명랑한 성격으로, 친구들 사이를 조율하는 따뜻한 인물이다.',
  },
  {
    id: 'paul',
    name: '폴',
    description: '아론이 졸업 이후 만나게 되는 친구. 의젓하고 어른스러운 분위기를 가졌으나 은근히 엉뚱한 면모도 지닌 입체적인 인물이다.',
  },
  {
    id: 'kai',
    name: '카이',
    description: '어린 나이에 부와 명예를 얻은 연예인. 성공과 욕망에 관심이 많지만, 자기 사람을 챙기는 의리도 가진 인물이다.',
  },
  {
    id: 'lai',
    name: '라이',
    description:
      '노숙 생활을 하며 삶의 끝자락에 서 있던 인물. 모든 것을 포기하려던 순간, 아론의 버려진 악보를 보고 은혜받고 거듭난 삶을 살아간다.',
  },
];

const characters: Character[] = characterSeeds.map((c, i) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  photoUrl: null,
  sortOrder: i,
}));

const budgetNames = [
  '기획 및 홍보',
  '티켓 제작',
  '이동 및 차량 대여',
  '식비와 숙박',
  '무대 제작',
  '의상 · 분장 · 소품',
  '음향과 조명',
  '예비비',
];

const budget: BudgetItem[] = budgetNames.map((name, i) => ({ id: `b${i}`, name, sortOrder: i }));

const prayerTexts = [
  '준비 과정 가운데 하나님의 개입 없는 보통의 일들과의 분명한 구분이 있길 소망합니다.',
  '이 일을 통해 하나님께서 이루고자 하시는 일들이 조명되기를 소망합니다.',
  '함께하는 모든 영혼들 가운데 기름부으심과 강건함이 더해지길 소망합니다.',
  '모든 필요가 합당하게 채워지기를 소망합니다.',
  '사단의 공격과 방해하는 모든 세력들로부터 보호해 주시옵소서.',
  '뮤지컬 관계자들의 구별된 삶이 먼저 되게 하옵소서.',
];

const prayers: Prayer[] = prayerTexts.map((text, i) => ({ id: `p${i}`, text, sortOrder: i }));

const peopleSeeds: { label: string; members: { role: string; name: string }[] }[] = [
  {
    label: '헤더진',
    members: [
      { role: '연출', name: '정은수' },
      { role: '조연출', name: '권도원' },
      { role: '디자인팀장', name: '정은민' },
      { role: '미디어팀장', name: '김수연' },
      { role: '홍보팀장', name: '홍빛' },
      { role: '무대감독', name: '이하은' },
      { role: '안무팀장', name: '이하늘' },
      { role: '의소품팀장', name: '김가은' },
    ],
  },
  {
    label: '팀원',
    members: [
      { role: '기획팀', name: '김은성' },
      { role: '기획팀', name: '장시은' },
      { role: '디자인팀', name: '구정서' },
      { role: '미디어팀', name: '안새진' },
      { role: '미디어팀', name: '권은수' },
      { role: '미디어팀', name: '박지유' },
      { role: '홍보팀', name: '임은혜' },
      { role: '무대팀', name: '박명인' },
      { role: '의소품팀', name: '오주형' },
      { role: '음향·음악팀', name: '김시온' },
      { role: '음향·음악팀', name: '강민규' },
      { role: '음향·음악팀', name: '김태범' },
      { role: '음향·음악팀', name: '배유미' },
      { role: '음향·음악팀', name: '봉승빈' },
      { role: '음향·음악팀', name: '봉종빈' },
      { role: '음향·음악팀', name: '주찬영' },
      { role: '음향·음악팀', name: '최요한' },
      { role: '음향·음악팀', name: '이시온' },
    ],
  },
  {
    label: '배우',
    members: [
      { role: '', name: '정주은' },
      { role: '', name: '신현택' },
      { role: '', name: '박주은' },
      { role: '', name: '김수' },
      { role: '', name: '박승주' },
      { role: '', name: '장지훈' },
      { role: '', name: '예수아' },
      { role: '', name: '예재빈' },
      { role: '', name: '오예현' },
      { role: '', name: '정영인' },
      { role: '', name: '진예빈' },
      { role: '', name: '추서연' },
      { role: '', name: '고은수' },
      { role: '', name: '양다인' },
      { role: '', name: '임현민' },
      { role: '', name: '정수지' },
      { role: '', name: '정인준' },
    ],
  },
];
const people: PeopleGroup[] = peopleSeeds.map((g, gi) => ({
  id: `g${gi}`,
  label: g.label,
  sortOrder: gi,
  members: g.members.map((m, i) => {
    const isTeamGroup = gi === 1; // 팀원
    return {
      id: `g${gi}m${i}`,
      role: isTeamGroup ? '' : m.role,
      team: isTeamGroup ? m.role : '',
      name: m.name,
      tagline: '',
      bio: '',
      photoUrl: null,
      sortOrder: i,
    };
  }),
}));

const facts: Fact[] = [
  { key: 'FORM', value: '창작 뮤지컬' },
  { key: 'GENRE', value: '드라마' },
  { key: 'PRODUCED', value: 'Praysound' },
  { key: 'RUNNING', value: '약 2시간 (인터미션 포함)' },
  { key: 'DATE', value: '2027년 1월 또는 2월 예정' },
];

export const content: AllContent = {
  site: {
    heroVerse: '“사람이 마음으로 자기의 길을 계획할지라도\n그의 걸음을 인도하시는 이는 여호와시니라”',
    heroSubtitle: '구별된 사람들',
    heroMeta: '2027 창작뮤지컬 · 제작 PRAYSOUND\n연출 정은수 · 2027.01–02 예정',
    aboutGreeting: '인사말 원문이 확보되는 대로 이 자리에 들어갑니다. 3~5문단 분량을 기준으로 여백을 잡아두었습니다.',
    praysoundStory1: 'Praysound는 세상 모든 아픔에 하나님의 위로를 전달하는 매개가 되어 궁극적으로 영혼 구원의 사명을 이루는 사역팀입니다.',
    praysoundStory2:
      '앞으로 Praysound는 — 실패를 지나온 사람에게 다시 일어설 용기를 / 상처 입은 사람에게 하나님의 위로를 / 길을 잃은 사람에게 그 언젠가 말씀하신 부르심의 기억을 선물하고 싶습니다. <나지르>는 그 선물입니다.',
    logline: '실패로 신앙을 잃은 청년이, 버린 노래를 통해 하나님의 뜻과 자신의 사명을 다시 발견한다.',
    synopsis:
      '신앙과 재능 모두 완벽한 청년 “아론”은 평생의 목표였던 오디션에서 탈락하며 삶과 믿음이 동시에 무너진다. 방황 끝에 세상과 타협하며 자신을 잃어가던 그는, 오디션을 위해 만들었다가 실패 이후 버렸던 자신의 노래가 누군가의 인생을 살렸다는 사실을 알게 된다. 그 경험을 통해 아론은 성공이 아닌 ‘쓰임’이 하나님의 뜻일 수 있음을 깨닫는다.',
    facts,
    processIntro: '준비 과정을 있는 그대로 공개합니다. 함께하는 사람들과 필요한 예산을 모아 주세요.',
    peopleIntro: '각자의 자리에서 기도하며 준비하는 배우와 헤더진, 스태프가 함께 <나지르>를 세워가고 있습니다.',
    budgetTotal: '₩ 9,000,000',
    budgetNote: '항목별 금액은 확정 후 공개됩니다. 공연 종료 후 결산 내역을 후원자께 공유합니다.',
    joinVerse: '“한 사람이면 패하겠거니와 두 사람이면 맞설 수 있나니 세 겹 줄은 쉽게 끊어지지 아니하느니라”',
    joinVerseRef: '전도서 4:12',
    supportIntro:
      '하나님의 사람들이 모이면 그 안에는 힘이 있습니다. 보내주신 후원은 공연을 준비하는 데 필요한 곳에 소중히 사용됩니다. 하나님의 위로를 전하는 이 사역이 온전히 세워질 수 있도록, 함께해 주세요.',
    supportFormUrl: 'https://forms.gle/dtEFEf2E1ArqGEwH6',
    accountBank: 'KAKAOBANK',
    accountNumber: '3333-23-3584437',
    accountHolder: '예금주 정은수',
    prayerIntro: '무대보다 먼저, 우리의 마음이 하나님 앞에 준비되기를 원합니다.',
    qnaIntro:
      '<나지르>에 대해 궁금한 점이나 응원의 말을 자유롭게 남겨 주세요. 작품, 공연 준비 과정에 대한 질문도 좋고, 짧은 기도와 응원의 한 마디도 큰 힘이 됩니다.',
    qnaUrl: 'https://www.joey.team/b/hS1LZbUjUeYC7HxjompE',
    instagramMain: 'https://www.instagram.com/pray_sound_official/',
    instagramMusical: 'https://www.instagram.com/musical_naz/',
    youtube: 'https://www.youtube.com/@PRAYSOUND2025',
    contactInstagram: 'https://www.instagram.com/musical_naz/',
  },
  characters,
  timeline,
  budget,
  prayers,
  people,
};

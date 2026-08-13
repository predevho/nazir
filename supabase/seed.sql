-- 나지르 콘텐츠 시드 데이터 (Phase 2B Task 5)
-- 원본: content/data.ts. 재실행 가능(upsert)하도록 on conflict 처리.
-- 대시보드 SQL Editor에서 0001_init.sql 실행 이후에 이 파일 전체를 붙여넣어 실행하세요.

-- ── content_blocks (site의 문자열 필드, facts 제외) ──────────
insert into content_blocks (key, value) values
  ('heroVerse', '“사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라”'),
  ('heroSubtitle', '구별된 사람들'),
  ('heroMeta', E'2027 창작뮤지컬 · 제작 PRAYSOUND\n연출 정은수 · 2027.01–02 예정'),
  ('aboutGreeting', '인사말 원문이 확보되는 대로 이 자리에 들어갑니다. 3~5문단 분량을 기준으로 여백을 잡아두었습니다.'),
  ('praysoundStory1', 'Praysound는 세상 모든 아픔에 하나님의 위로를 전달하는 매개가 되어 궁극적으로 영혼 구원의 사명을 이루는 사역팀입니다.'),
  ('praysoundStory2', '앞으로 Praysound는 — 실패를 지나온 사람에게 다시 일어설 용기를 / 상처 입은 사람에게 하나님의 위로를 / 길을 잃은 사람에게 그 언젠가 말씀하신 부르심의 기억을 선물하고 싶습니다. <나지르>는 그 선물입니다.'),
  ('logline', '실패로 신앙을 잃은 청년이, 버린 노래를 통해 하나님의 뜻과 자신의 사명을 다시 발견한다.'),
  ('synopsis', '신앙과 재능 모두 완벽한 청년 “아론”은 평생의 목표였던 오디션에서 탈락하며 삶과 믿음이 동시에 무너진다. 방황 끝에 세상과 타협하며 자신을 잃어가던 그는, 오디션을 위해 만들었다가 실패 이후 버렸던 자신의 노래가 누군가의 인생을 살렸다는 사실을 알게 된다. 그 경험을 통해 아론은 성공이 아닌 ‘쓰임’이 하나님의 뜻일 수 있음을 깨닫는다.'),
  ('processIntro', '준비 과정을 있는 그대로 공개합니다. 함께하는 사람들과 필요한 예산을 모아 주세요.'),
  ('peopleIntro', '각자의 자리에서 기도하며 준비하는 배우와 헤더진, 스태프가 함께 <나지르>를 세워가고 있습니다.'),
  ('budgetTotal', '₩ 9,000,000'),
  ('budgetNote', '항목별 금액은 확정 후 공개됩니다. 공연 종료 후 결산 내역을 후원자께 공유합니다.'),
  ('joinVerse', '“한 사람이면 패하겠거니와 두 사람이면 맞설 수 있나니 세 겹 줄은 쉽게 끊어지지 아니하느니라”'),
  ('joinVerseRef', '전도서 4:12'),
  ('supportIntro', '하나님의 사람들이 모이면 그 안에는 힘이 있습니다. 보내주신 후원은 공연을 준비하는 데 필요한 곳에 소중히 사용됩니다. 하나님의 위로를 전하는 이 사역이 온전히 세워질 수 있도록, 함께해 주세요.'),
  ('supportFormUrl', 'https://forms.gle/dtEFEf2E1ArqGEwH6'),
  ('accountBank', 'KAKAOBANK'),
  ('accountNumber', '3333-23-3584437'),
  ('accountHolder', '예금주 정은수'),
  ('prayerIntro', '무대보다 먼저, 우리의 마음이 하나님 앞에 준비되기를 원합니다.'),
  ('qnaIntro', '<나지르>에 대해 궁금한 점이나 응원의 말을 자유롭게 남겨 주세요. 작품, 공연 준비 과정에 대한 질문도 좋고, 짧은 기도와 응원의 한 마디도 큰 힘이 됩니다.'),
  ('qnaUrl', 'https://www.joey.team/b/hS1LZbUjUeYC7HxjompE'),
  ('instagramMain', 'https://www.instagram.com/'),
  ('instagramMusical', 'https://www.instagram.com/'),
  ('youtube', 'https://www.youtube.com/'),
  ('contactInstagram', 'https://www.instagram.com/musical_naz/')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ── facts ─────────────────────────────────────────────────
insert into facts (id, key, value, sort_order) values
  ('f0', 'FORM', '창작 뮤지컬', 0),
  ('f1', 'GENRE', '드라마', 1),
  ('f2', 'PRODUCED', 'Praysound', 2),
  ('f3', 'RUNNING', '약 2시간 (인터미션 포함)', 3),
  ('f4', 'DATE', '2027년 1월 또는 2월 예정', 4)
on conflict (id) do update set key = excluded.key, value = excluded.value, sort_order = excluded.sort_order;

-- ── characters ────────────────────────────────────────────
insert into characters (id, name, description, photo_url, sort_order) values
  ('aron', '아론', '신앙과 재능 모두 완벽해 보였던 청년. 오디션 탈락 이후 무너진 시간을 지나지만, 자신의 진정한 사명 앞에 다시 돌아오게 된다.', null, 0),
  ('hanna', '한나', '아론이 졸업 이후 만나게 되는 친구. 소심하고 조용하지만 누구보다 따뜻한 마음씨를 가졌으며, 무너진 아론을 위해 눈물로 기도한다.', null, 1),
  ('nana', '나나', '아론이 졸업 이후 만나게 되는 친구. 밝고 명랑한 성격으로, 친구들 사이를 조율하는 따뜻한 인물이다.', null, 2),
  ('paul', '폴', '아론이 졸업 이후 만나게 되는 친구. 의젓하고 어른스러운 분위기를 가졌으나 은근히 엉뚱한 면모도 지닌 입체적인 인물이다.', null, 3),
  ('kai', '카이', '어린 나이에 부와 명예를 얻은 연예인. 성공과 욕망에 관심이 많지만, 자기 사람을 챙기는 의리도 가진 인물이다.', null, 4),
  ('lai', '라이', '노숙 생활을 하며 삶의 끝자락에 서 있던 인물. 모든 것을 포기하려던 순간, 아론의 버려진 악보를 보고 은혜받고 거듭난 삶을 살아간다.', null, 5)
on conflict (id) do update set name = excluded.name, description = excluded.description, photo_url = excluded.photo_url, sort_order = excluded.sort_order;

-- ── timeline_events ───────────────────────────────────────
insert into timeline_events (id, period, title, status, sort_order) values
  ('t0', '26.01.12 ~ 26.06.28', '대본 작업', '완료', 0),
  ('t1', '26.01.20 ~ 26.06.19', '헤더진 구성 및 팀원 모집', '완료', 1),
  ('t2', '26.01.26 ~ 26.06.16', '뮤지컬 넘버 제작', '완료', 2),
  ('t3', '26.03.12 ~ 26.03.14', '뮤지컬 넘버 가이드 녹음 송캠프', '완료', 3),
  ('t4', '26.04.10', 'SNS 계정 개설 및 홍보', '완료', 4),
  ('t5', '26.04.23 ~ 26.04.24', '1차 배우 오디션', '완료', 5),
  ('t6', '26.04.28 ~ 26.04.30', '1차 교내 장사', '완료', 6),
  ('t7', '26.05.24', '전체 스태프 및 배우 회의', '완료', 7),
  ('t8', '26.05.30', '2차 배우 오디션', '완료', 8),
  ('t9', '26.03.12 ~ 26.07.15', '뮤지컬 넘버 편곡, 악보 채보', '진행 중', 9),
  ('t10', '26.05.25 ~ 26.06.07', '후원처 조사', '진행 중', 10),
  ('t11', '26.07.15 ~ 26.07.18', '뮤지컬 넘버 보컬 본 녹음 송캠프', '예정', 11),
  ('t12', '26.08.04 ~ 26.08.07', '전체 인원 여름 합숙', '예정', 12),
  ('t13', '26.08.09 ~', '배우 연습 시작', '예정', 13),
  ('t14', '26.09.01 ~', '학기 중 배우 연습 진행', '예정', 14),
  ('t15', '26.10', '2차 교내 장사', '예정', 15),
  ('t16', '26.11 ~', '드라이 리허설', '예정', 16),
  ('t17', '26.11.30 ~ 27.01', '티켓 판매 시작', '예정', 17),
  ('t18', '26.12', '전체 인원 겨울 합숙', '예정', 18),
  ('t19', '27.01 또는 27.02', '<나지르> 공연', '예정', 19)
on conflict (id) do update set period = excluded.period, title = excluded.title, status = excluded.status, sort_order = excluded.sort_order;

-- ── budget_items ──────────────────────────────────────────
insert into budget_items (id, name, sort_order) values
  ('b0', '기획 및 홍보', 0),
  ('b1', '티켓 제작', 1),
  ('b2', '이동 및 차량 대여', 2),
  ('b3', '식비와 숙박', 3),
  ('b4', '무대 제작', 4),
  ('b5', '의상 · 분장 · 소품', 5),
  ('b6', '음향과 조명', 6),
  ('b7', '예비비', 7)
on conflict (id) do update set name = excluded.name, sort_order = excluded.sort_order;

-- ── prayers ───────────────────────────────────────────────
insert into prayers (id, text, sort_order) values
  ('p0', '준비 과정 가운데 하나님의 개입 없는 보통의 일들과의 분명한 구분이 있길 소망합니다.', 0),
  ('p1', '이 일을 통해 하나님께서 이루고자 하시는 일들이 조명되기를 소망합니다.', 1),
  ('p2', '함께하는 모든 영혼들 가운데 기름부으심과 강건함이 더해지길 소망합니다.', 2),
  ('p3', '모든 필요가 합당하게 채워지기를 소망합니다.', 3),
  ('p4', '사단의 공격과 방해하는 모든 세력들로부터 보호해 주시옵소서.', 4),
  ('p5', '뮤지컬 관계자들의 구별된 삶이 먼저 되게 하옵소서.', 5)
on conflict (id) do update set text = excluded.text, sort_order = excluded.sort_order;

-- ── people_groups ─────────────────────────────────────────
insert into people_groups (id, label, sort_order) values
  ('g0', '헤더진', 0),
  ('g1', '팀원', 1),
  ('g2', '배우', 2)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;

-- ── people_members ────────────────────────────────────────
insert into people_members (id, group_id, text, sort_order) values
  ('g0m0', 'g0', '연출 정은수 / 조연출 권도원', 0),
  ('g0m1', 'g0', '디자인팀장 정은민 / 미디어팀장 김수연 / 홍보팀장 홍빛', 1),
  ('g0m2', 'g0', '무대감독 이하은 / 안무팀장 이하늘 / 의소품팀장 김가은', 2),
  ('g1m0', 'g1', '기획팀 김은성 · 장시은', 0),
  ('g1m1', 'g1', '디자인팀 구정서', 1),
  ('g1m2', 'g1', '미디어팀 안새진 · 권은수 · 박지유', 2),
  ('g1m3', 'g1', '홍보팀 임은혜', 3),
  ('g1m4', 'g1', '무대팀 박명인', 4),
  ('g1m5', 'g1', '의소품팀 오주형', 5),
  ('g1m6', 'g1', '음향 · 음악팀 김시온 · 강민규 · 김태범 · 배유미 · 봉승빈 · 봉종빈 · 주찬영 · 최요한 · 이시온', 6),
  ('g2m0', 'g2', '정주은, 신현택, 박주은, 김수, 박승주, 장지훈', 0),
  ('g2m1', 'g2', '외 예수아 · 예재빈 · 오예현 · 정영인 · 진예빈 · 추서연 · 고은수 · 양다인 · 임현민 · 정수지 · 정인준', 1)
on conflict (id) do update set group_id = excluded.group_id, text = excluded.text, sort_order = excluded.sort_order;

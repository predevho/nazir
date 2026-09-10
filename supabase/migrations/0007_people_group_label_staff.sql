-- 그룹 라벨을 시안 탭 표기에 맞춘다: 팀원 → 스탭진
-- Figma `개발자용 페이지` > `함께하는 사람들` 탭 3개 = 헤더진 / 스탭진 / 배우
-- 배포 Supabase 대시보드 SQL Editor에서 1회 실행. where 가드로 재실행 안전.
update people_groups set label = '스탭진' where label = '팀원';

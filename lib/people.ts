import type { AllContent, PeopleGroup, PeopleMember } from '../content/types';

export type TeamBucket = { team: string; members: PeopleMember[] };

/** 멤버를 team 값으로 묶되 첫 등장 순서를 유지한다. team ''는 하나의 빈 버킷으로. */
export function groupMembersByTeam(members: PeopleMember[]): TeamBucket[] {
  const buckets: TeamBucket[] = [];
  const index = new Map<string, TeamBucket>();
  for (const member of members) {
    let bucket = index.get(member.team);
    if (!bucket) {
      bucket = { team: member.team, members: [] };
      index.set(member.team, bucket);
      buckets.push(bucket);
    }
    bucket.members.push(member);
  }
  return buckets;
}

/**
 * `함께하는 사람들` 탭 해석. 시안은 헤더진·스탭진·배우 3개 프레임이고,
 * 코드에서는 `?tab=<label>` 하나로 다룬다. 없는 label이면 첫 그룹으로 떨어뜨린다.
 */
export function resolvePeopleTab(groups: PeopleGroup[], requested?: string): PeopleGroup | null {
  if (groups.length === 0) return null;
  return groups.find((g) => g.label === requested) ?? groups[0];
}

/** 카드에 쓸 한 줄 라벨. 헤더진은 직책(role), 스탭진은 팀(team), 배우는 빈 문자열. */
export function memberRoleLabel(member: PeopleMember): string {
  return member.role || member.team;
}

/** 모든 그룹을 훑어 id 일치 멤버와 소속 그룹 label을 반환. 없으면 null. */
export function findPersonById(
  content: AllContent,
  id: string
): { member: PeopleMember; groupLabel: string } | null {
  for (const group of content.people) {
    const member = group.members.find((mm) => mm.id === id);
    if (member) return { member, groupLabel: group.label };
  }
  return null;
}

import type { AllContent, PeopleMember } from '../content/types';

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

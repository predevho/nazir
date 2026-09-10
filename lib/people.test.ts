import { describe, it, expect } from 'vitest';
import { groupMembersByTeam, findPersonById, resolvePeopleTab, memberRoleLabel } from './people';
import type { AllContent, PeopleGroup, PeopleMember } from '../content/types';

function m(id: string, team: string, name = id): PeopleMember {
  return { id, role: '', team, name, tagline: '', bio: '', photoUrl: null, sortOrder: 0 };
}

describe('groupMembersByTeam', () => {
  it('team별로 묶되 첫 등장 순서를 유지한다', () => {
    const r = groupMembersByTeam([m('a', '연출팀'), m('b', '기획팀'), m('c', '연출팀')]);
    expect(r).toEqual([
      { team: '연출팀', members: [m('a', '연출팀'), m('c', '연출팀')] },
      { team: '기획팀', members: [m('b', '기획팀')] },
    ]);
  });
  it('team이 빈 멤버는 빈 team 버킷으로 묶인다', () => {
    const r = groupMembersByTeam([m('a', ''), m('b', '')]);
    expect(r).toEqual([{ team: '', members: [m('a', ''), m('b', '')] }]);
  });
  it('빈 배열은 빈 결과', () => {
    expect(groupMembersByTeam([])).toEqual([]);
  });
});

describe('findPersonById', () => {
  const content = {
    people: [
      { id: 'g0', label: '헤더진', sortOrder: 0, members: [m('g0m0', '연출팀', '정은수')] },
      { id: 'g1', label: '팀원', sortOrder: 1, members: [m('g1m0', '기획팀', '김은성')] },
    ],
  } as unknown as AllContent;
  it('여러 그룹에서 id로 멤버와 그룹 label을 찾는다', () => {
    expect(findPersonById(content, 'g1m0')).toEqual({ member: m('g1m0', '기획팀', '김은성'), groupLabel: '팀원' });
  });
  it('없으면 null', () => {
    expect(findPersonById(content, 'zzz')).toBeNull();
  });
});

describe('resolvePeopleTab', () => {
  const groups: PeopleGroup[] = [
    { id: 'g0', label: '헤더진', sortOrder: 0, members: [] },
    { id: 'g1', label: '스탭진', sortOrder: 1, members: [] },
    { id: 'g2', label: '배우', sortOrder: 2, members: [] },
  ];
  it('label이 맞는 그룹을 고른다', () => {
    expect(resolvePeopleTab(groups, '배우')?.id).toBe('g2');
  });
  it('탭이 없으면 첫 그룹으로 떨어진다', () => {
    expect(resolvePeopleTab(groups)?.id).toBe('g0');
  });
  it('없는 label이면 첫 그룹으로 떨어진다', () => {
    expect(resolvePeopleTab(groups, '없는탭')?.id).toBe('g0');
  });
  it('그룹이 없으면 null', () => {
    expect(resolvePeopleTab([], '배우')).toBeNull();
  });
});

describe('memberRoleLabel', () => {
  it('role이 있으면 role (헤더진)', () => {
    expect(memberRoleLabel({ ...m('x', ''), role: '연출' })).toBe('연출');
  });
  it('role이 비면 team (스탭진)', () => {
    expect(memberRoleLabel(m('x', '기획팀'))).toBe('기획팀');
  });
  it('둘 다 비면 빈 문자열 (배우)', () => {
    expect(memberRoleLabel(m('x', ''))).toBe('');
  });
});

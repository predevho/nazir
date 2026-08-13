import { describe, it, expect } from 'vitest';
import { getContent, assembleContent } from './content';

describe('getContent (폴백 경로)', () => {
  it('env가 없으면 로컬 데이터를 반환한다', async () => {
    const data = await getContent();
    expect(data.characters).toHaveLength(6);
    expect(data.site.accountNumber).toBe('3333-23-3584437');
  });
});

describe('assembleContent', () => {
  it('행 집합을 AllContent로 조립한다(정렬·people 중첩·site 병합 포함)', () => {
    const result = assembleContent({
      blocks: [
        { key: 'accountNumber', value: '1234-56-7890' },
        { key: 'heroSubtitle', value: '구별된 사람들' },
      ],
      facts: [{ id: 'f1', key: 'FORM', value: '창작 뮤지컬', sort_order: 0 }],
      characters: [
        { id: 'b', name: '한나', description: '설명B', photo_url: null, sort_order: 1 },
        { id: 'a', name: '아론', description: '설명A', photo_url: 'http://img/a.jpg', sort_order: 0 },
      ],
      timeline: [{ id: 't0', period: '26.01', title: '대본', status: '완료', sort_order: 0 }],
      budget: [{ id: 'b0', name: '기획', sort_order: 0 }],
      prayers: [{ id: 'p0', text: '기도1', sort_order: 0 }],
      groups: [
        { id: 'g1', label: '팀원', sort_order: 1 },
        { id: 'g0', label: '헤더진', sort_order: 0 },
      ],
      members: [
        { id: 'g0m0', group_id: 'g0', role: '연출', name: '정은수', bio: '', photo_url: null, sort_order: 0 },
        { id: 'g1m0', group_id: 'g1', role: '기획팀', name: '김은성', bio: '', photo_url: null, sort_order: 0 },
      ],
    });
    expect(result.site.accountNumber).toBe('1234-56-7890');
    expect(result.site.facts).toEqual([{ key: 'FORM', value: '창작 뮤지컬' }]);
    expect(result.characters.map((c) => c.name)).toEqual(['아론', '한나']);
    expect(result.characters[0].photoUrl).toBe('http://img/a.jpg');
    expect(result.people.map((g) => g.label)).toEqual(['헤더진', '팀원']);
    expect(result.people[0].members[0].name).toBe('정은수');
  });

  it('content_blocks에 없는 site 필드는 로컬 기본값으로 채운다', () => {
    const result = assembleContent({
      blocks: [], facts: [], characters: [], timeline: [], budget: [], prayers: [], groups: [], members: [],
    });
    expect(result.site.heroSubtitle).toBe('구별된 사람들');
  });
});

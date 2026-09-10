import { describe, it, expect } from 'vitest';
import { ADMIN_LISTS } from './adminLists';

describe('ADMIN_LISTS', () => {
  it('단순 목록 6종을 정의한다', () => {
    expect(Object.keys(ADMIN_LISTS).sort()).toEqual(
      ['budget', 'characters', 'facts', 'letters', 'prayers', 'timeline'].sort()
    );
  });
  it('테이블 매핑이 정확하다', () => {
    expect(ADMIN_LISTS.timeline.table).toBe('timeline_events');
    expect(ADMIN_LISTS.budget.table).toBe('budget_items');
    expect(ADMIN_LISTS.facts.table).toBe('facts');
    expect(ADMIN_LISTS.letters.table).toBe('about_letters');
  });
  it('편지 이미지는 섹션 선택 + 이미지 + 대체 텍스트로 구성된다', () => {
    const cols = ADMIN_LISTS.letters.columns;
    expect(cols.map((c) => c.key)).toEqual(['section', 'image_url', 'caption']);
    expect(cols.find((c) => c.key === 'image_url')?.type).toBe('image');
    expect(cols.find((c) => c.key === 'section')?.options?.map((o) => o.value)).toEqual([
      'greeting',
      'praysound',
    ]);
  });
  it('timeline status는 select이고 3개 옵션(완료/진행 중/예정)이다', () => {
    const status = ADMIN_LISTS.timeline.columns.find((c) => c.key === 'status');
    expect(status?.type).toBe('select');
    expect(status?.options?.map((o) => o.value)).toEqual(['완료', '진행 중', '예정']);
  });
});

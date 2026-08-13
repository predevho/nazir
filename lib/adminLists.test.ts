import { describe, it, expect } from 'vitest';
import { ADMIN_LISTS } from './adminLists';

describe('ADMIN_LISTS', () => {
  it('단순 목록 5종을 정의한다', () => {
    expect(Object.keys(ADMIN_LISTS).sort()).toEqual(
      ['budget', 'characters', 'facts', 'prayers', 'timeline'].sort()
    );
  });
  it('테이블 매핑이 정확하다', () => {
    expect(ADMIN_LISTS.timeline.table).toBe('timeline_events');
    expect(ADMIN_LISTS.budget.table).toBe('budget_items');
    expect(ADMIN_LISTS.facts.table).toBe('facts');
  });
  it('timeline status는 select이고 3개 옵션(완료/진행 중/예정)이다', () => {
    const status = ADMIN_LISTS.timeline.columns.find((c) => c.key === 'status');
    expect(status?.type).toBe('select');
    expect(status?.options?.map((o) => o.value)).toEqual(['완료', '진행 중', '예정']);
  });
});

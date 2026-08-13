import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser, gUpsert, mUpsert, gSelect, mSelect, gDeleteIn, mDeleteIn, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
  gUpsert: vi.fn().mockResolvedValue({ error: null }),
  mUpsert: vi.fn().mockResolvedValue({ error: null }),
  gSelect: vi.fn().mockResolvedValue({ data: [{ id: 'g0' }], error: null }),
  mSelect: vi.fn().mockResolvedValue({ data: [{ id: 'g0m0' }, { id: 'old' }], error: null }),
  gDeleteIn: vi.fn().mockResolvedValue({ error: null }),
  mDeleteIn: vi.fn().mockResolvedValue({ error: null }),
  revalidatePath: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser },
    from: (table: string) =>
      table === 'people_groups'
        ? { upsert: gUpsert, select: gSelect, delete: () => ({ in: gDeleteIn }) }
        : { upsert: mUpsert, select: mSelect, delete: () => ({ in: mDeleteIn }) },
  }),
}));

import { savePeople } from './actions';

function fd(groups: unknown) {
  const f = new FormData();
  f.set('groups', JSON.stringify(groups));
  return f;
}

beforeEach(() => {
  [gUpsert, mUpsert, gDeleteIn, mDeleteIn, revalidatePath].forEach((m) => m.mockClear());
});

describe('savePeople', () => {
  it('그룹·멤버를 sort_order와 함께 upsert하고 누락 멤버를 삭제한다', async () => {
    const res = await savePeople(
      { ok: false, message: '' },
      fd([{ id: 'g0', label: '헤더진', members: [{ id: 'g0m0', role: '연출', name: '정은수', bio: '' }] }])
    );
    expect(gUpsert).toHaveBeenCalledOnce();
    expect(gUpsert.mock.calls[0][0][0]).toMatchObject({ id: 'g0', label: '헤더진', sort_order: 0 });
    expect(mUpsert).toHaveBeenCalledOnce();
    expect(mUpsert.mock.calls[0][0][0]).toMatchObject({ id: 'g0m0', group_id: 'g0', role: '연출', name: '정은수', sort_order: 0 });
    // 기존 'old' 멤버는 제출 안 됨 → 삭제
    expect(mDeleteIn).toHaveBeenCalledWith('id', ['old']);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.ok).toBe(true);
  });
});

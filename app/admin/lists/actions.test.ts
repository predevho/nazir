import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser, upsert, select, deleteIn, del, revalidatePath } = vi.hoisted(() => {
  const deleteIn = vi.fn().mockResolvedValue({ error: null });
  return {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    select: vi.fn().mockResolvedValue({ data: [{ id: 'b0' }, { id: 'old' }], error: null }),
    deleteIn,
    del: vi.fn(() => ({ in: deleteIn })),
    revalidatePath: vi.fn(),
  };
});
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, from: () => ({ upsert, select, delete: del }) }),
}));

import { saveList } from './actions';

function fd(listKey: string, rows: unknown) {
  const f = new FormData();
  f.set('listKey', listKey);
  f.set('rows', JSON.stringify(rows));
  return f;
}

beforeEach(() => {
  upsert.mockClear();
  deleteIn.mockClear();
  revalidatePath.mockClear();
});

describe('saveList', () => {
  it('알 수 없는 목록은 거부한다', async () => {
    const res = await saveList({ ok: false, message: '' }, fd('bogus', []));
    expect(res.ok).toBe(false);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('upsert(sort_order 부여)하고 누락 행 삭제 후 성공을 반환한다', async () => {
    const res = await saveList({ ok: false, message: '' }, fd('budget', [{ id: 'b0', name: '기획' }]));
    expect(upsert).toHaveBeenCalledOnce();
    const rows = upsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0]).toMatchObject({ id: 'b0', name: '기획', sort_order: 0 });
    expect(deleteIn).toHaveBeenCalledWith('id', ['old']);
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.ok).toBe(true);
  });
});

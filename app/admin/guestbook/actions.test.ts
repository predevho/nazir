import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser, updateEq, update, deleteEq, del, revalidatePath, redirect } = vi.hoisted(() => {
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const deleteEq = vi.fn().mockResolvedValue({ error: null });
  return {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
    updateEq,
    update: vi.fn(() => ({ eq: updateEq })),
    deleteEq,
    del: vi.fn(() => ({ eq: deleteEq })),
    revalidatePath: vi.fn(),
    redirect: vi.fn(),
  };
});
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, from: () => ({ update, delete: del }) }),
}));

import { moderateEntry } from './actions';

const fd = (id: string, op: string) => {
  const f = new FormData();
  f.set('id', id);
  f.set('op', op);
  return f;
};
const initial = { ok: false, message: '' };

beforeEach(() => {
  update.mockClear();
  del.mockClear();
  updateEq.mockClear();
  deleteEq.mockClear();
});

describe('moderateEntry', () => {
  it('hides an entry', async () => {
    const r = await moderateEntry(initial, fd('e1', 'hold'));
    expect(update).toHaveBeenCalledWith({ is_held: true });
    expect(updateEq).toHaveBeenCalledWith('id', 'e1');
    expect(r.ok).toBe(true);
  });

  it('publishes a held entry', async () => {
    await moderateEntry(initial, fd('e1', 'release'));
    expect(update).toHaveBeenCalledWith({ is_held: false });
  });

  it('deletes an entry', async () => {
    const r = await moderateEntry(initial, fd('e1', 'delete'));
    expect(del).toHaveBeenCalled();
    expect(deleteEq).toHaveBeenCalledWith('id', 'e1');
    expect(r.ok).toBe(true);
  });

  it('하트를 켠다 — 제작팀이 응원에 답하는 표시', async () => {
    const r = await moderateEntry(initial, fd('e1', 'heart'));
    expect(update).toHaveBeenCalledWith({ is_hearted: true });
    expect(updateEq).toHaveBeenCalledWith('id', 'e1');
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/하트/);
  });

  it('하트를 거둔다', async () => {
    await moderateEntry(initial, fd('e1', 'unheart'));
    expect(update).toHaveBeenCalledWith({ is_hearted: false });
  });

  it('하트도 공개 게시판을 다시 그린다', async () => {
    revalidatePath.mockClear();
    await moderateEntry(initial, fd('e1', 'heart'));
    expect(revalidatePath).toHaveBeenCalledWith('/guestbook');
  });

  it('refreshes the public board as well as the admin list', async () => {
    await moderateEntry(initial, fd('e1', 'release'));
    expect(revalidatePath).toHaveBeenCalledWith('/guestbook');
  });

  it('rejects an unknown op instead of guessing', async () => {
    const r = await moderateEntry(initial, fd('e1', 'wipe'));
    expect(r.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  it('DB 가 거절하면 실패로 알리고 화면을 다시 그리지 않는다 — 0014 미적용 때 하트 버튼이 타는 길', async () => {
    revalidatePath.mockClear();
    updateEq.mockResolvedValueOnce({ error: { message: 'column "is_hearted" does not exist' } });
    const r = await moderateEntry(initial, fd('e1', 'heart'));
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/처리 실패/);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects a missing id', async () => {
    const r = await moderateEntry(initial, fd('', 'delete'));
    expect(r.ok).toBe(false);
    expect(del).not.toHaveBeenCalled();
  });
});

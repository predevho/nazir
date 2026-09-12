import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getUser, updateEq, update, revalidatePath, redirect } = vi.hoisted(() => {
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  return {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'staff@nazir.local' } } }),
    updateEq,
    update: vi.fn(() => ({ eq: updateEq })),
    revalidatePath: vi.fn(),
    redirect: vi.fn(),
  };
});

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, from: () => ({ update }) }),
}));

import { toggleGuestbookHeart } from './actions';

const fd = (id: string, op: string) => {
  const f = new FormData();
  f.set('id', id);
  f.set('op', op);
  return f;
};

const initial = { ok: false, message: '' };

beforeEach(() => {
  getUser.mockClear();
  update.mockClear();
  updateEq.mockClear();
  revalidatePath.mockClear();
  redirect.mockClear();
});

describe('toggleGuestbookHeart', () => {
  it('하트를 켠다', async () => {
    const r = await toggleGuestbookHeart(initial, fd('e1', 'heart'));

    expect(update).toHaveBeenCalledWith({ is_hearted: true });
    expect(updateEq).toHaveBeenCalledWith('id', 'e1');
    expect(revalidatePath).toHaveBeenCalledWith('/guestbook');
    expect(revalidatePath).toHaveBeenCalledWith('/admin/guestbook');
    expect(r.ok).toBe(true);
  });

  it('하트를 거둔다', async () => {
    await toggleGuestbookHeart(initial, fd('e1', 'unheart'));

    expect(update).toHaveBeenCalledWith({ is_hearted: false });
    expect(updateEq).toHaveBeenCalledWith('id', 'e1');
  });

  it('하트 전용 경로라 다른 관리자 동작은 거절한다', async () => {
    const r = await toggleGuestbookHeart(initial, fd('e1', 'delete'));

    expect(r.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it('로그인하지 않았으면 관리자 로그인으로 보낸다', async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });

    await toggleGuestbookHeart(initial, fd('e1', 'heart'));

    expect(redirect).toHaveBeenCalledWith('/admin/login');
  });

  it('관리자 계정이 아니면 하트를 바꾸지 않는다', async () => {
    getUser.mockResolvedValueOnce({ data: { user: { id: 'u2', email: 'guest@example.com' } } });

    await toggleGuestbookHeart(initial, fd('e1', 'heart'));

    expect(redirect).toHaveBeenCalledWith('/admin/login');
    expect(update).not.toHaveBeenCalled();
  });
});

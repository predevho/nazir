import { describe, it, expect, vi } from 'vitest';

const { getUser, upsert, revalidatePath } = vi.hoisted(() => ({
  getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'admin@nazir.local' } } }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
  revalidatePath: vi.fn(),
}));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, from: () => ({ upsert }) }),
}));

import { saveContent } from './actions';

describe('saveContent', () => {
  it('로그인 상태에서 upsert하고 revalidate 후 성공을 반환한다', async () => {
    const fd = new FormData();
    fd.set('accountNumber', '9999-99-9999');
    const res = await saveContent({ ok: false, message: '' }, fd);
    expect(upsert).toHaveBeenCalledOnce();
    const rows = upsert.mock.calls[0][0] as Array<{ key: string; value: string }>;
    expect(rows.find((r) => r.key === 'accountNumber')?.value).toBe('9999-99-9999');
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(res.ok).toBe(true);
  });
});

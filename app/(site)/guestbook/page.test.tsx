import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import GuestbookPage from './page';
import { toggleGuestbookHeart } from './actions';

const { getUser, noteProps } = vi.hoisted(() => ({
  getUser: vi.fn(),
  noteProps: [] as Array<{ heartAction?: unknown }>,
}));

vi.mock('@/lib/content', () => ({
  getContent: async () => ({ site: { guestbookIntro: '' } }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock('@/lib/supabase/read', () => ({
  createReadClient: () => ({
    from: (table: string) => {
      if (table === 'guestbook_entries') {
        return {
          select: (_columns: string, opts?: { count?: string; head?: boolean }) =>
            opts?.head
              ? Promise.resolve({ count: 1, error: null })
              : {
                  order: () => ({
                    range: () =>
                      Promise.resolve({
                        data: [
                          {
                            id: 'e1',
                            name: '정은수',
                            message: '응원합니다',
                            is_hearted: false,
                            created_at: '2026-08-26T04:00:00.000Z',
                          },
                        ],
                        error: null,
                      }),
                  }),
                },
        };
      }

      return {
        select: () => ({
          in: () => ({
            order: () => Promise.resolve({ data: [] }),
          }),
        }),
      };
    },
  }),
}));

vi.mock('./actions', () => ({
  toggleGuestbookHeart: vi.fn(),
}));

vi.mock('@/components/guestbook/GuestbookForm', () => ({
  GuestbookForm: () => null,
}));

vi.mock('@/components/guestbook/GuestbookPager', () => ({
  GuestbookPager: () => null,
}));

vi.mock('@/components/guestbook/GuestbookNote', () => ({
  GuestbookNote: (props: { heartAction?: unknown }) => {
    noteProps.push(props);
    return null;
  },
}));

beforeEach(() => {
  getUser.mockReset();
  noteProps.length = 0;
});

describe('GuestbookPage', () => {
  it('로그인 상태면 공개 방명록 쪽지에도 하트 액션을 내려준다', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'staff@nazir.local' } } });

    render(await GuestbookPage({ searchParams: Promise.resolve({}) }));

    expect(noteProps[0].heartAction).toBe(toggleGuestbookHeart);
  });

  it('비로그인 상태면 공개 방명록 쪽지에 하트 액션을 내려주지 않는다', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    render(await GuestbookPage({ searchParams: Promise.resolve({}) }));

    expect(noteProps[0].heartAction).toBeUndefined();
  });

  it('관리자 계정이 아니면 공개 방명록 쪽지에 하트 액션을 내려주지 않는다', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u2', email: 'guest@example.com' } } });

    render(await GuestbookPage({ searchParams: Promise.resolve({}) }));

    expect(noteProps[0].heartAction).toBeUndefined();
  });
});

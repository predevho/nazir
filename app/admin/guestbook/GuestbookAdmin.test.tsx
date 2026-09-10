import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestbookAdmin, type AdminEntry } from './GuestbookAdmin';

vi.mock('./actions', () => ({ moderateEntry: vi.fn() }));

const entry = (over: Partial<AdminEntry> = {}): AdminEntry => ({
  id: 'e1',
  name: '정은수',
  message: '응원합니다',
  isHeld: false,
  createdAt: '2026-08-26T04:00:00.000Z',
  ...over,
});

describe('GuestbookAdmin', () => {
  it('says so when nothing has been posted yet', () => {
    render(<GuestbookAdmin entries={[]} />);
    expect(screen.getByText('아직 등록된 응원글이 없습니다.')).toBeInTheDocument();
  });

  it('counts the entries waiting for review', () => {
    render(
      <GuestbookAdmin
        entries={[entry({ id: 'a', isHeld: true }), entry({ id: 'b', isHeld: true }), entry({ id: 'c' })]}
      />,
    );
    expect(screen.getByText(/검토 대기 2건/)).toBeInTheDocument();
  });

  it('offers 숨기기 for a visible entry and 공개하기 for a held one', () => {
    render(<GuestbookAdmin entries={[entry({ id: 'a' }), entry({ id: 'b', isHeld: true })]} />);
    expect(screen.getByRole('button', { name: '숨기기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '공개하기' })).toBeInTheDocument();
  });

  it('does not delete on the first click — it asks again', async () => {
    const user = userEvent.setup();
    render(<GuestbookAdmin entries={[entry()]} />);
    await user.click(screen.getByRole('button', { name: '삭제' }));
    expect(screen.getByRole('button', { name: /정말 삭제/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('button', { name: /정말 삭제/ })).not.toBeInTheDocument();
  });

  it('sends the right op for each button', async () => {
    const user = userEvent.setup();
    render(<GuestbookAdmin entries={[entry({ id: 'x', isHeld: true })]} />);
    const release = screen.getByRole('button', { name: '공개하기' });
    const form = release.closest('form')!;
    expect(form.querySelector('input[name="op"]')).toHaveValue('release');
    expect(form.querySelector('input[name="id"]')).toHaveValue('x');

    await user.click(screen.getByRole('button', { name: '삭제' }));
    const del = screen.getByRole('button', { name: /정말 삭제/ }).closest('form')!;
    expect(del.querySelector('input[name="op"]')).toHaveValue('delete');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Join from './Join';

describe('Join', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  it('shows account number and support/qna links', async () => {
    render(<Join />);
    expect(await screen.findByText('3333-23-3584437')).toBeInTheDocument();
    const support = await screen.findByRole('link', { name: /후원 신청서/ });
    expect(support).toHaveAttribute('href', 'https://forms.gle/dtEFEf2E1ArqGEwH6');
    expect(await screen.findByRole('link', { name: /질문 · 응원 남기기/ })).toBeInTheDocument();
  });
  it('copies the account number', async () => {
    render(<Join />);
    await userEvent.click(await screen.findByRole('button', { name: /계좌번호 복사/ }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('3333-23-3584437');
  });
});

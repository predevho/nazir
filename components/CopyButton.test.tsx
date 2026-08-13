import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './CopyButton';

describe('CopyButton', () => {
  beforeEach(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });
  it('copies the value and shows confirmation label', async () => {
    render(<CopyButton value="3333-23-3584437" idleLabel="계좌번호 복사하기" doneLabel="복사되었습니다" />);
    const btn = screen.getByRole('button', { name: '계좌번호 복사하기' });
    await userEvent.click(btn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('3333-23-3584437');
    expect(await screen.findByRole('button', { name: '복사되었습니다' })).toBeInTheDocument();
  });
});

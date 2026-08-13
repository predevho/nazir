import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ADMIN_LISTS } from '@/lib/adminLists';

vi.mock('./actions', () => ({ saveList: vi.fn() }));
import { ListEditor } from './ListEditor';

describe('ListEditor', () => {
  it('초기 행/값과 저장 버튼을 렌더한다', () => {
    render(<ListEditor config={ADMIN_LISTS.budget} initialRows={[{ id: 'b0', name: '기획' }]} />);
    expect(screen.getByDisplayValue('기획')).toBeInTheDocument();
    expect(screen.getByText('항목명')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('행 추가/삭제가 동작한다', async () => {
    render(<ListEditor config={ADMIN_LISTS.budget} initialRows={[{ id: 'b0', name: '기획' }]} />);
    expect(screen.getAllByRole('textbox').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 행 추가' }));
    expect(screen.getAllByRole('textbox').length).toBe(2);
    await userEvent.click(screen.getAllByRole('button', { name: '행 삭제' })[1]);
    expect(screen.getAllByRole('textbox').length).toBe(1);
  });
});

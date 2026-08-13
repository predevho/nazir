import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./actions', () => ({ savePeople: vi.fn() }));
import { PeopleEditor } from './PeopleEditor';

const initial = [{ id: 'g0', label: '헤더진', members: [{ id: 'g0m0', role: '연출', name: '정은수', bio: '' }] }];

describe('PeopleEditor', () => {
  it('그룹 라벨과 멤버 값, 저장 버튼을 렌더한다', () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getByDisplayValue('헤더진')).toBeInTheDocument();
    expect(screen.getByDisplayValue('정은수')).toBeInTheDocument();
    expect(screen.getByDisplayValue('연출')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });

  it('멤버 추가/삭제가 동작한다', async () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getAllByLabelText('이름').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 멤버 추가' }));
    expect(screen.getAllByLabelText('이름').length).toBe(2);
    await userEvent.click(screen.getAllByRole('button', { name: '멤버 삭제' })[1]);
    expect(screen.getAllByLabelText('이름').length).toBe(1);
  });

  it('그룹 추가가 동작한다', async () => {
    render(<PeopleEditor initialGroups={initial} />);
    expect(screen.getAllByLabelText('그룹 이름').length).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: '+ 그룹 추가' }));
    expect(screen.getAllByLabelText('그룹 이름').length).toBe(2);
  });
});

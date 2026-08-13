import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('./actions', () => ({ saveContent: vi.fn() }));
import { ContentEditForm } from './ContentEditForm';

describe('ContentEditForm', () => {
  it('섹션 라벨과 값, 저장 버튼을 렌더한다', () => {
    render(<ContentEditForm values={{ accountNumber: '3333-23-3584437', synopsis: '테스트 시놉' }} />);
    expect(screen.getByText('계좌번호')).toBeInTheDocument();
    expect(screen.getByText('시놉시스')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3333-23-3584437')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument();
  });
});

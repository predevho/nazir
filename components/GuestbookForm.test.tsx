import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuestbookForm } from './GuestbookForm';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe('GuestbookForm', () => {
  it('labels both fields for screen readers, since the design shows no visible labels', () => {
    render(<GuestbookForm />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByLabelText('메시지')).toBeInTheDocument();
  });

  it('never drops below 16px on phones, or iOS zooms the page on focus', () => {
    // 15px 이하 입력칸에 포커스가 가면 사파리가 화면을 확대하고 그대로 남는다.
    // 데스크톱은 시안값 15px 그대로라 sm: 접두사가 붙은 쪽만 작아야 한다.
    render(<GuestbookForm />);
    for (const field of ['이름', '메시지']) {
      const cls = screen.getByLabelText(field).className;
      expect(cls).toContain('text-[16px]');
      expect(cls).toContain('sm:text-[15px]');
    }
  });

  it('stacks on phones so the message field is not squeezed to a third of the row', () => {
    // 시안은 781 폭 한 줄이다. 390 화면에서 그 비율을 유지하면 메시지 칸이 167px가 된다.
    const { container } = render(<GuestbookForm />);
    const row = container.querySelector('form > div');
    expect(row?.className).toContain('flex-col');
    expect(row?.className).toContain('sm:flex-row');
  });
});

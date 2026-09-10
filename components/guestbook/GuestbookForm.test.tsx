import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('보류됐을 때 무엇에 걸렸는지는 알려주지 않는다', async () => {
    // 사유를 알려주면 우회를 도와주는 셈이다. 예전 문구("링크가 포함된 글은")는
    // 이제 사실과도 다르다 — 욕설·광고·연락처·도배로도 걸린다.
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ ok: true, held: true }) })));
    const user = userEvent.setup();
    render(<GuestbookForm />);
    await user.type(screen.getByLabelText('이름'), '임현호');
    await user.type(screen.getByLabelText('메시지'), '응원합니다');
    await user.click(screen.getByRole('button', { name: '응원 남기기' }));

    const notice = await screen.findByRole('status');
    expect(notice).toHaveTextContent('등록되었습니다');
    expect(notice.textContent).not.toMatch(/링크|욕설|광고|연락처/);
  });
});
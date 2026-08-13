import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { signInWithPassword } = vi.hoisted(() => ({
  signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
// 리프 패키지를 목킹해 실제 createClient()가 env 없이도 동작하도록(별칭 목킹 회피).
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({ auth: { signInWithPassword } }),
}));

import LoginPage from './page';

describe('LoginPage', () => {
  it('renders username/password fields and submit button', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('아이디')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('아이디 입력을 내부 이메일(@nazir.local)로 변환해 로그인한다', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByLabelText('아이디'), 'nazir1234');
    await userEvent.type(screen.getByLabelText('비밀번호'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'nazir1234@nazir.local',
      password: 'secret123',
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }));
// 리프 패키지를 목킹해 실제 createClient()가 env 없이도 동작하도록(별칭 목킹 회피).
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({ auth: { signInWithPassword } }),
}));

import LoginPage from './page';

// jsdom 의 location.assign 은 호출하면 "Not implemented" 를 던지므로 갈아끼운다.
const assign = vi.fn();

beforeEach(() => {
  assign.mockClear();
  signInWithPassword.mockReset().mockResolvedValue({ error: null });
  Object.defineProperty(window, 'location', { configurable: true, value: { assign } });
});

async function login(id = 'nazir1234', pw = 'secret123') {
  render(<LoginPage />);
  await userEvent.type(screen.getByLabelText('아이디'), id);
  await userEvent.type(screen.getByLabelText('비밀번호'), pw);
  await userEvent.click(screen.getByRole('button', { name: '로그인' }));
}

describe('LoginPage', () => {
  it('아이디·비밀번호 칸과 로그인 버튼을 그린다', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('아이디')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('아이디 입력을 내부 이메일(@nazir.local)로 변환해 로그인한다', async () => {
    await login();
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'nazir1234@nazir.local',
      password: 'secret123',
    });
  });

  /*
    라우터 이동(router.push)으로는 로그인 전에 캐시된 "로그인으로 돌려보내기" 결과가
    다시 재생되어 로그인 화면에 머문다. 문서를 새로 열어야 세션 쿠키가 실려 나간다.
  */
  it('성공하면 문서를 새로 열어 /admin 으로 간다', async () => {
    await login();
    expect(assign).toHaveBeenCalledWith('/admin');
  });

  it('넘어가는 동안 버튼을 잠가 둔다 — 두 번 눌리지 않게', async () => {
    await login();
    expect(screen.getByRole('button', { name: '로그인 중…' })).toBeDisabled();
  });

  it('실패하면 이동하지 않고 이유를 알린다', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    await login();
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByText(/로그인에 실패했습니다/)).toBeInTheDocument();
    // 다시 시도할 수 있어야 한다
    expect(screen.getByRole('button', { name: '로그인' })).toBeEnabled();
  });
});

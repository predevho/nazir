import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Curtain } from './Curtain';

// vi.mock 은 끌어올려지므로 바깥 변수를 바로 참조할 수 없다. vi.hoisted 로 같이 올린다.
const nav = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

afterEach(() => {
  vi.useRealTimers();
  nav.pathname = '/';
});

describe('Curtain', () => {
  it('홈에서 막이 오르고, 다 열리면 스스로 사라진다', () => {
    vi.useFakeTimers();
    render(<Curtain />);
    expect(screen.getByTestId('curtain')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2400));
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });

  it('홈이 아닌 화면으로 바로 들어오면 막을 치지 않는다', () => {
    nav.pathname = '/about/greeting';
    render(<Curtain />);
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });

  it('관리자 화면에서도 치지 않는다', () => {
    nav.pathname = '/admin/lists/timeline';
    render(<Curtain />);
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });

  it('다른 화면으로 들어온 뒤 홈으로 이동해도 막이 튀어나오지 않는다', () => {
    // 판단은 마운트 시점의 경로로 한 번만 한다. 이동에 반응하면 읽던 화면이 가려진다.
    nav.pathname = '/guestbook';
    const { rerender } = render(<Curtain />);
    nav.pathname = '/';
    rerender(<Curtain />);
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });
});

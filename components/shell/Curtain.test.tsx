import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';

// 모듈 수준 플래그를 쓰므로 검사마다 모듈을 새로 불러 방문을 초기화한다.
async function freshCurtain() {
  vi.resetModules();
  return (await import('./Curtain')).Curtain;
}

afterEach(() => vi.useRealTimers());

describe('Curtain', () => {
  it('막이 올라가고, 다 열리면 스스로 사라진다', async () => {
    const Curtain = await freshCurtain();
    vi.useFakeTimers();
    render(<Curtain />);
    expect(screen.getByTestId('curtain')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2400));
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });

  it('한 방문에 한 번만 친다 — 홈으로 돌아올 때마다 가리면 방해가 된다', async () => {
    const Curtain = await freshCurtain();
    vi.useFakeTimers();
    const first = render(<Curtain />);
    act(() => vi.advanceTimersByTime(2400));
    first.unmount();

    // 홈을 떠났다 돌아오면 페이지가 다시 마운트된다. 그래도 막은 다시 내려오지 않는다.
    render(<Curtain />);
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });
});

/*
  "홈에서만 뜬다"를 조건문으로 지키면 조건이 틀릴 수 있다. 놓는 자리로 지킨다 —
  홈 페이지에만 있고 공통 레이아웃에는 없어야 한다. 레이아웃으로 옮겨지면 여기서 걸린다.
*/
describe('Curtain 이 놓인 자리', () => {
  it('홈 페이지에만 있고 공통 레이아웃에는 없다', () => {
    const home = readFileSync('app/(site)/page.tsx', 'utf8');
    const layout = readFileSync('app/(site)/layout.tsx', 'utf8');
    expect(home).toContain('<Curtain />');
    expect(layout, '레이아웃에 두면 모든 화면에서 막이 내려온다').not.toContain('Curtain');
  });
});

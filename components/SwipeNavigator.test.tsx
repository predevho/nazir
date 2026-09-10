import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SwipeNavigator } from './SwipeNavigator';
import { SWIPE_HINT_KEY } from './SwipeHint';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/about/praysound',
}));

const neighbors = {
  prev: { href: '/about/greeting', label: '01 연출의 인사말' },
  next: { href: '/about/work', label: '03 작품 소개' },
};

/** matchMedia 를 손가락 기기 / 마우스 기기로 바꿔 끼운다. */
function setDevice({ coarse, reduced = false }: { coarse: boolean; reduced?: boolean }) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('pointer: coarse') ? coarse : q.includes('reduce') ? reduced : false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
}

const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }] });
const endTouch = (x: number, y: number) => ({ changedTouches: [{ clientX: x, clientY: y }] });

function drag(el: HTMLElement, from: [number, number], to: [number, number]) {
  fireEvent.touchStart(el, touch(...from));
  fireEvent.touchMove(el, touch(...to));
  fireEvent.touchEnd(el, endTouch(...to));
}

beforeEach(() => {
  push.mockClear();
  localStorage.clear();
  setDevice({ coarse: true });
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const view = (n = neighbors) =>
  render(
    <SwipeNavigator neighbors={n}>
      <p>본문</p>
      <div data-swipe-ignore>
        <span>편지</span>
      </div>
    </SwipeNavigator>,
  ).container.firstElementChild as HTMLElement;

describe('SwipeNavigator — 손가락을 따라가는 이동', () => {
  it('미는 동안 본문이 손가락만큼 따라온다', () => {
    const box = view();
    fireEvent.touchStart(box, touch(300, 400));
    fireEvent.touchMove(box, touch(220, 404));
    expect(box.style.transform).toBe('translateX(-80px)');
  });

  it('넘어갈 곳이 없는 쪽으로는 저항을 주어 조금만 밀린다', () => {
    // 첫 장에서 오른쪽(이전)으로 미는 상황
    const box = view({ next: neighbors.next });
    fireEvent.touchStart(box, touch(100, 400));
    fireEvent.touchMove(box, touch(180, 402));
    expect(box.style.transform).toBe('translateX(20px)'); // 80 * 0.25
  });

  it('세로가 우세하면 아예 따라오지 않는다 — 스크롤을 빼앗지 않는다', () => {
    const box = view();
    fireEvent.touchStart(box, touch(300, 400));
    fireEvent.touchMove(box, touch(280, 500));
    expect(box.style.transform).toBe('');
    fireEvent.touchEnd(box, endTouch(280, 500));
    expect(push).not.toHaveBeenCalled();
  });

  it('충분히 밀면 다음 장으로 넘어가고 인라인 위치는 지워진다', () => {
    const box = view();
    drag(box, [300, 400], [150, 405]);
    expect(push).toHaveBeenCalledWith('/about/work');
    expect(box.style.transform).toBe('');
  });

  it('덜 밀면 제자리로 돌아오고 이동하지 않는다', () => {
    const box = view();
    drag(box, [300, 400], [270, 402]);
    expect(push).not.toHaveBeenCalled();
    expect(box.style.transform).toBe('');
  });

  it('편지처럼 자체 스와이프가 있는 영역에서 시작한 제스처는 무시한다', () => {
    const box = view();
    const letter = screen.getByText('편지');
    fireEvent.touchStart(letter, touch(300, 400));
    fireEvent.touchMove(letter, touch(150, 405));
    fireEvent.touchEnd(letter, endTouch(150, 405));
    expect(push).not.toHaveBeenCalled();
    expect(box.style.transform).toBe('');
  });
});

describe('SwipeNavigator — 코치마크', () => {
  const label = '왼쪽으로 밀어 다음 장으로';

  it('손가락 기기에서 처음 오면 안내가 뜬다', () => {
    view();
    expect(screen.getByText(label).closest('div')).toHaveAttribute('aria-hidden', 'false');
  });

  it('마우스 기기에는 뜨지 않는다 — 스와이프가 없다', () => {
    setDevice({ coarse: false });
    view();
    expect(screen.getByText(label).closest('div')).toHaveAttribute('aria-hidden', 'true');
  });

  it('마지막 장에는 뜨지 않는다 — 넘길 다음이 없다', () => {
    view({ prev: neighbors.prev });
    expect(screen.getByText(label).closest('div')).toHaveAttribute('aria-hidden', 'true');
  });

  it('한 번 본 기기에서는 다시 뜨지 않는다', () => {
    localStorage.setItem(SWIPE_HINT_KEY, '1');
    view();
    expect(screen.getByText(label).closest('div')).toHaveAttribute('aria-hidden', 'true');
  });

  it('실제로 밀어 보면 사라지고 다시 뜨지 않는다', () => {
    const box = view();
    drag(box, [300, 400], [150, 405]);
    expect(screen.getByText(label).closest('div')).toHaveAttribute('aria-hidden', 'true');
    expect(localStorage.getItem(SWIPE_HINT_KEY)).toBe('1');
  });

  it('눌러서 치울 수 있다', () => {
    view();
    fireEvent.click(screen.getByText(label));
    expect(screen.getByText(label).closest('div')).toHaveAttribute('aria-hidden', 'true');
    expect(localStorage.getItem(SWIPE_HINT_KEY)).toBe('1');
  });

  it('가만히 두면 잠시 뒤 알아서 사라진다', () => {
    view();
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.getByText(label).closest('div')).toHaveAttribute('aria-hidden', 'true');
  });
});

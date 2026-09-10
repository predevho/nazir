import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import NotFound from './not-found';
import { NAV_ITEMS } from '@/content/nav';

describe('404 화면', () => {
  it('무슨 일이 생겼는지 사람 말로 알린다', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: '이 장면은 무대에 없습니다' })).toBeInTheDocument();
  });

  it('돌아갈 길을 크게 둔다', () => {
    render(<NotFound />);
    expect(screen.getByRole('link', { name: '처음으로 돌아가기' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '나지르 홈' })).toHaveAttribute('href', '/');
  });

  it('상단 메뉴 다섯 곳으로 바로 갈 수 있다', () => {
    render(<NotFound />);
    const nav = within(screen.getByRole('navigation', { name: '주요 메뉴' }));
    for (const item of NAV_ITEMS) {
      expect(nav.getByRole('link', { name: item.label })).toHaveAttribute('href', item.to);
    }
  });

  /*
    `404` 는 개발자에게만 익숙한 번호다. 보는 사람 대부분에게는 뜻 없는 세 자리라
    화면에 두지 않기로 했다. 꾸미다가 슬그머니 되돌아오는 일이 없게 못 박아 둔다.
  */
  it('화면에 404 라는 숫자를 쓰지 않는다', () => {
    const { container } = render(<NotFound />);
    expect(container.textContent).not.toContain('404');
  });
});

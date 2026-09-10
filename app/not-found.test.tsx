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

  it('큰 숫자는 낭독기에서 읽히지 않는다 — 바로 아래 문장이 같은 말을 한다', () => {
    render(<NotFound />);
    expect(screen.queryByText('404')).toHaveAttribute('aria-hidden', 'true');
  });
});

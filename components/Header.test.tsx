import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';

const { pathname } = vi.hoisted(() => ({ pathname: { current: '/about' } }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

describe('Header', () => {
  it('renders the five nav links from the design', () => {
    pathname.current = '/';
    render(<Header />);
    for (const label of ['나지르에 대하여', '제작 과정', '함께하는 사람들', '후원과 기도', '응원 게시판']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('marks the active route', () => {
    pathname.current = '/about';
    render(<Header />);
    expect(screen.getByRole('link', { name: '나지르에 대하여' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '제작 과정' })).not.toHaveAttribute('aria-current');
  });

  it('marks the parent menu active on a nested route', () => {
    pathname.current = '/people/jung-eunsoo';
    render(<Header />);
    expect(screen.getByRole('link', { name: '함께하는 사람들' })).toHaveAttribute('aria-current', 'page');
  });

  it('links the CTA straight to the support form', () => {
    pathname.current = '/';
    render(<Header supportFormUrl="https://forms.gle/example" />);
    expect(
      screen.getAllByRole('link', { name: '후원 바로가기' }).every(
        (a) => a.getAttribute('href') === 'https://forms.gle/example',
      ),
    ).toBe(true);
  });
});

describe('Header — 모바일 햄버거', () => {
  it('starts collapsed', () => {
    pathname.current = '/';
    render(<Header />);
    const toggle = screen.getByRole('button', { name: '메뉴 열기' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // 접혀 있을 때는 데스크톱 메뉴 한 벌만 있다
    expect(screen.getAllByRole('link', { name: '제작 과정' })).toHaveLength(1);
  });

  it('opens the menu and exposes the links', async () => {
    const user = userEvent.setup();
    pathname.current = '/';
    render(<Header />);
    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    expect(screen.getByRole('button', { name: '메뉴 닫기' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: '제작 과정' })).toHaveLength(2);
  });

  it('closes again after tapping a link so the page is not covered', async () => {
    const user = userEvent.setup();
    pathname.current = '/';
    render(<Header />);
    await user.click(screen.getByRole('button', { name: '메뉴 열기' }));
    const links = screen.getAllByRole('link', { name: '제작 과정' });
    await user.click(links[links.length - 1]);
    expect(screen.getByRole('button', { name: '메뉴 열기' })).toBeInTheDocument();
  });
});

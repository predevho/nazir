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
  it('로고 자리에 심볼 이미지가 들어가고, 이름은 aria-label 이 맡는다', () => {
    // 예전에는 글자 'N' 이었다. 이미지에는 alt 를 비워 두고 링크의 aria-label 로
    // "나지르 홈"을 전한다 — 둘 다 읽으면 스크린리더가 같은 말을 두 번 한다.
    render(<Header />);
    const home = screen.getByRole('link', { name: '나지르 홈' });
    const img = home.querySelector('img')!;
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('/images/logo-symbol.webp');
    expect(img.getAttribute('alt')).toBe('');
    // 폭을 auto 로 두어야 원본 비율(980×1016)이 찌그러지지 않는다
    expect(img.className).toContain('w-auto');
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

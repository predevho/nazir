import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    expect(screen.getByRole('link', { name: '후원 바로가기' })).toHaveAttribute(
      'href',
      'https://forms.gle/example',
    );
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

vi.mock('next/navigation', () => ({ usePathname: () => '/about' }));

describe('Header', () => {
  it('renders nav links and marks the active route', () => {
    render(<Header />);
    const about = screen.getByRole('link', { name: '대하여' });
    expect(about).toBeInTheDocument();
    expect(about).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '함께하기' })).toBeInTheDocument();
  });
});

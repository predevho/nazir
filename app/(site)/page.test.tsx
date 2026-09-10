import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('keeps an accessible h1 even though the hero copy lives inside the image', () => {
    render(<Home />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('창작뮤지컬 <나지르> 기록 및 후원 안내');
    expect(h1).toHaveClass('sr-only');
  });

  it('renders the five section cards from the design', () => {
    render(<Home />);
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '/about',
      '/process',
      '/people',
      '/join',
      '/guestbook',
    ]);
  });
});

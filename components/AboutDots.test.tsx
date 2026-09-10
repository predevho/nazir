import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutDots } from './AboutDots';

describe('AboutDots', () => {
  it('renders one dot per sub page', () => {
    render(<AboutDots activeSlug="greeting" />);
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('marks the current page, not always the first one', () => {
    render(<AboutDots activeSlug="work" />);
    expect(screen.getByRole('link', { name: '03 작품 소개' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '01 연출의 인사말' })).not.toHaveAttribute('aria-current');
  });

  it('gives every dot an accessible label since it has no text', () => {
    render(<AboutDots activeSlug="greeting" />);
    for (const name of ['01 연출의 인사말', '02 Praysound에 대하여', '03 작품 소개', '04 작품 속 인물']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument();
    }
  });
});

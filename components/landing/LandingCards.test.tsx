import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingCards } from './LandingCards';
import { LANDING_CARDS } from '@/content/landing';

describe('LandingCards', () => {
  it('renders the five cards from the design in order', () => {
    render(<LandingCards cards={LANDING_CARDS} />);
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/about',
      '/process',
      '/people',
      '/join',
      '/guestbook',
    ]);
  });

  it('shows title and subtitle for each card', () => {
    render(<LandingCards cards={LANDING_CARDS} />);
    expect(screen.getByText('<나지르>에 대하여')).toBeInTheDocument();
    expect(screen.getByText('연출의 인사말 · Praysound · 작품 소개')).toBeInTheDocument();
    expect(screen.getByText('헤더진 · 스탭진 · 배우')).toBeInTheDocument();
  });

  it('keeps the icon decorative so the title carries the accessible name', () => {
    render(<LandingCards cards={LANDING_CARDS} />);
    expect(screen.getByRole('link', { name: /제작 과정/ })).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('LANDING_CARDS', () => {
  it('flags the three cards whose copy is still the placeholder from card 1', () => {
    const unconfirmed = LANDING_CARDS.filter((c) => !c.copyConfirmed).map((c) => c.to);
    expect(unconfirmed).toEqual(['/people', '/join', '/guestbook']);
  });

  it('does not ship the duplicated design copy', () => {
    const first = LANDING_CARDS[0].description;
    expect(LANDING_CARDS.slice(1).some((c) => c.description === first)).toBe(false);
  });
});

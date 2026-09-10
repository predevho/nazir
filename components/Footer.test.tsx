import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';
import { content } from '../content/data';

describe('Footer', () => {
  it('renders the three columns from the design', () => {
    render(<Footer site={content.site} />);
    for (const title of ['문의', '더 알아보기', '후원하기']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  it('shows the contact phone unmasked (Figma comment #47)', () => {
    render(<Footer site={content.site} />);
    const phone = screen.getByRole('link', { name: content.site.contactPhone });
    expect(phone).toHaveAttribute('href', 'tel:01095457091');
    expect(screen.getByText(/대표 정은수/)).toBeInTheDocument();
  });

  it('links the support form and shows the account number', () => {
    render(<Footer site={content.site} />);
    expect(screen.getByRole('link', { name: '후원 구글폼 바로가기' })).toHaveAttribute(
      'href',
      content.site.supportFormUrl,
    );
    expect(screen.getByText(/3333-23-3584437/)).toBeInTheDocument();
  });

  it('renders without site content', () => {
    render(<Footer />);
    expect(screen.getByRole('heading', { name: '문의' })).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuestbookPager } from './GuestbookPager';

describe('GuestbookPager', () => {
  it('renders nothing when everything fits on one page', () => {
    const { container } = render(<GuestbookPager page={1} totalPages={1} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the position and links to the next page', () => {
    render(<GuestbookPager page={1} totalPages={3} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '다음 페이지' })).toHaveAttribute(
      'href',
      '/guestbook?page=2',
    );
  });

  it('links back to the bare path from page 2 so page 1 has one url', () => {
    render(<GuestbookPager page={2} totalPages={3} />);
    expect(screen.getByRole('link', { name: '이전 페이지' })).toHaveAttribute('href', '/guestbook');
  });

  it('drops the arrow instead of linking past the ends', () => {
    render(<GuestbookPager page={1} totalPages={2} />);
    expect(screen.queryByRole('link', { name: '이전 페이지' })).not.toBeInTheDocument();
  });

  it('drops the next arrow on the last page', () => {
    render(<GuestbookPager page={2} totalPages={2} />);
    expect(screen.queryByRole('link', { name: '다음 페이지' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '이전 페이지' })).toBeInTheDocument();
  });
});

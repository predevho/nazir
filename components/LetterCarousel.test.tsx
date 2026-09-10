import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LetterCarousel } from './LetterCarousel';

const images = ['/a.webp', '/b.webp', '/c.webp'];

describe('LetterCarousel', () => {
  it('explains the gap instead of rendering a broken frame when images are missing', () => {
    render(<LetterCarousel images={[]} label="연출의 인사말" />);
    expect(screen.getByText(/이미지가 아직 준비되지 않았습니다/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the first page and the total count', () => {
    render(<LetterCarousel images={images} label="연출의 인사말" />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/a.webp');
  });

  it('gives each image alt text since it replaces body copy', () => {
    render(<LetterCarousel images={images} label="연출의 인사말" />);
    expect(screen.getByRole('img', { name: '연출의 인사말 1번째 장' })).toBeInTheDocument();
  });

  it('moves forward and wraps around at the end', async () => {
    const user = userEvent.setup();
    render(<LetterCarousel images={images} label="연출의 인사말" />);
    await user.click(screen.getByRole('button', { name: '다음 장' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음 장' }));
    await user.click(screen.getByRole('button', { name: '다음 장' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('wraps around backwards from the first page', async () => {
    const user = userEvent.setup();
    render(<LetterCarousel images={images} label="연출의 인사말" />);
    await user.click(screen.getByRole('button', { name: '이전 장' }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });
});

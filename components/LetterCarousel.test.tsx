import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LetterCarousel } from './LetterCarousel';
import type { AboutLetter } from '../content/types';

const letter = (n: number, over: Partial<AboutLetter> = {}): AboutLetter => ({
  id: `l${n}`,
  section: 'greeting',
  imageUrl: `/images/letter-${n}.webp`,
  caption: `편지 ${n}장`,
  sortOrder: n,
  ...over,
});

describe('LetterCarousel', () => {
  it('explains the gap instead of rendering a broken frame when nothing is registered', () => {
    render(<LetterCarousel letters={[]} label="연출의 인사말" />);
    expect(screen.getByText(/이미지가 아직 등록되지 않았습니다/)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('skips rows whose image was never uploaded', () => {
    render(<LetterCarousel letters={[letter(1, { imageUrl: null })]} label="연출의 인사말" />);
    expect(screen.getByText(/이미지가 아직 등록되지 않았습니다/)).toBeInTheDocument();
  });

  it('takes the page count from the number of registered images, not a fixed 5', () => {
    render(<LetterCarousel letters={[letter(1), letter(2)]} label="연출의 인사말" />);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('hides the pager for a single image', () => {
    render(<LetterCarousel letters={[letter(1)]} label="연출의 인사말" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '다음 장' })).not.toBeInTheDocument();
  });

  it('uses the caption as alt text since the image replaces body copy', () => {
    render(<LetterCarousel letters={[letter(1), letter(2)]} label="연출의 인사말" />);
    expect(screen.getByRole('img', { name: '편지 1장' })).toBeInTheDocument();
  });

  it('falls back to a positional alt when the caption is blank', () => {
    render(
      <LetterCarousel letters={[letter(1, { caption: '' }), letter(2)]} label="연출의 인사말" />,
    );
    expect(screen.getByRole('img', { name: '연출의 인사말 1번째 장' })).toBeInTheDocument();
  });

  it('moves forward and wraps around at the end', async () => {
    const user = userEvent.setup();
    render(<LetterCarousel letters={[letter(1), letter(2), letter(3)]} label="연출의 인사말" />);
    await user.click(screen.getByRole('button', { name: '다음 장' }));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '다음 장' }));
    await user.click(screen.getByRole('button', { name: '다음 장' }));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('wraps around backwards from the first page', async () => {
    const user = userEvent.setup();
    render(<LetterCarousel letters={[letter(1), letter(2), letter(3)]} label="연출의 인사말" />);
    await user.click(screen.getByRole('button', { name: '이전 장' }));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });
});

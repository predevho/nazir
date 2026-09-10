import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuestbookNote } from './GuestbookNote';

const entry = {
  id: 'e1',
  name: '정은수',
  message: '함께 기도하겠습니다!',
  createdAt: '2026-08-26T04:00:00.000Z',
};

describe('GuestbookNote', () => {
  it('shows the name, message and date from the design layout', () => {
    render(<GuestbookNote entry={entry} index={0} />);
    expect(screen.getByText('정은수')).toBeInTheDocument();
    expect(screen.getByText('함께 기도하겠습니다!')).toBeInTheDocument();
    expect(screen.getByText('2026.08.26')).toBeInTheDocument();
  });

  it('alternates the background between neighbouring notes', () => {
    const { container: a } = render(<GuestbookNote entry={entry} index={0} />);
    const { container: b } = render(<GuestbookNote entry={entry} index={1} />);
    const bg = (c: HTMLElement) => c.querySelector('article')?.getAttribute('style') ?? '';
    expect(bg(a)).toContain('note-square.webp');
    expect(bg(b)).toContain('note-wide.webp');
  });

  it('tilts the tape the opposite way on the next note', () => {
    const { container: a } = render(<GuestbookNote entry={entry} index={0} />);
    const { container: b } = render(<GuestbookNote entry={entry} index={1} />);
    expect(a.querySelector('span')?.getAttribute('style')).toContain('rotate(8deg)');
    expect(b.querySelector('span')?.getAttribute('style')).toContain('rotate(-8deg)');
  });
});

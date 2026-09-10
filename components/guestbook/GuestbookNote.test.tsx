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

  it('붙은 답글을 쪽지 아래에 함께 보여준다 (명세 45행)', () => {
    render(
      <ul>
        <GuestbookNote
          entry={entry}
          index={0}
          replies={[
            { id: 'r1', entryId: entry.id, message: '고맙습니다', createdAt: '2026-08-27T04:00:00.000Z' },
          ]}
        />
      </ul>,
    );
    expect(screen.getByText('고맙습니다')).toBeInTheDocument();
    // 누가 쓴 답글인지 밝힌다. 답글은 운영진만 단다 — decisions.md C-2
    expect(screen.getByText('제작팀')).toBeInTheDocument();
  });

  it('답글이 없으면 아무 자리도 차지하지 않는다', () => {
    render(
      <ul>
        <GuestbookNote entry={entry} index={0} />
      </ul>,
    );
    expect(screen.queryByText('제작팀')).not.toBeInTheDocument();
  });

  it('답글이 여러 개면 순서대로 쌓는다 (1:N)', () => {
    render(
      <ul>
        <GuestbookNote
          entry={entry}
          index={0}
          replies={[
            { id: 'r1', entryId: entry.id, message: '먼저', createdAt: '2026-08-27T04:00:00.000Z' },
            { id: 'r2', entryId: entry.id, message: '나중', createdAt: '2026-08-28T04:00:00.000Z' },
          ]}
        />
      </ul>,
    );
    const shown = screen.getAllByText(/먼저|나중/).map((n) => n.textContent);
    expect(shown).toEqual(['먼저', '나중']);
  });
});
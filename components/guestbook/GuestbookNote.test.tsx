import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestbookNote } from './GuestbookNote';

const entry = {
  id: 'e1',
  name: '정은수',
  message: '함께 기도하겠습니다!',
  createdAt: '2026-08-26T04:00:00.000Z',
  isHearted: false,
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

  const reply = (id: string, message: string) => ({
    id, entryId: entry.id, message, createdAt: '2026-08-27T04:00:00.000Z',
  });

  it('댓글 아이콘을 눌러야 답글이 펼쳐진다 — 시안이 정한 동작', async () => {
    const user = userEvent.setup();
    render(
      <ul>
        <GuestbookNote entry={entry} index={0} replies={[reply('r1', '고맙습니다')]} />
      </ul>,
    );
    const toggle = screen.getByRole('button', { name: '답글 1개 보기' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    expect(screen.getByText('고맙습니다')).toBeVisible();
    expect(screen.getByRole('button', { name: '답글 접기' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('접혀 있을 때는 답글이 화면에 없다', () => {
    render(
      <ul>
        <GuestbookNote entry={entry} index={0} replies={[reply('r1', '고맙습니다')]} />
      </ul>,
    );
    expect(screen.getByText('고맙습니다')).not.toBeVisible();
  });

  it('답글이 없으면 아이콘도 두지 않는다 — 눌러도 아무 일 없는 아이콘은 없는 것만 못하다', () => {
    render(
      <ul>
        <GuestbookNote entry={entry} index={0} />
      </ul>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('답글이 여러 개면 개수를 아이콘 옆에 적고 순서대로 쌓는다 (1:N)', async () => {
    const user = userEvent.setup();
    render(
      <ul>
        <GuestbookNote entry={entry} index={0} replies={[reply('r1', '먼저'), reply('r2', '나중')]} />
      </ul>,
    );
    await user.click(screen.getByRole('button', { name: '답글 2개 보기' }));
    expect(screen.getAllByText(/먼저|나중/).map((n) => n.textContent)).toEqual(['먼저', '나중']);
  });

  it('종이를 늘리지 않고 9칸으로 잘라 쓴다 — 늘리면 악보 오선이 벌어진다', () => {
    const { container } = render(
      <ul>
        <GuestbookNote entry={entry} index={0} />
      </ul>,
    );
    const paper = container.querySelector('article') as HTMLElement;
    expect(paper.style.borderImage).toContain('note-square.webp');
    expect(paper.style.backgroundImage).toBe('');
  });

  it('제작팀 하트가 켜진 쪽지에는 하단 왼쪽에 하트가 붙는다', () => {
    render(
      <ul>
        <GuestbookNote entry={{ ...entry, isHearted: true }} index={0} />
      </ul>,
    );
    const heart = screen.getByRole('img', { name: '제작팀의 하트' });
    expect(heart).toHaveTextContent('제작팀');
    // 눌리는 것이 아니다
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('하트가 꺼진 쪽지에는 하트가 없다', () => {
    render(
      <ul>
        <GuestbookNote entry={entry} index={0} />
      </ul>,
    );
    expect(screen.queryByRole('img', { name: '제작팀의 하트' })).not.toBeInTheDocument();
  });

  it('답글과 하트가 같이 있으면 둘 다 그린다 — 댓글 아이콘이 먼저', () => {
    render(
      <ul>
        <GuestbookNote
          entry={{ ...entry, isHearted: true }}
          index={0}
          replies={[reply('r1', '고맙습니다')]}
        />
      </ul>,
    );
    const button = screen.getByRole('button', { name: '답글 1개 보기' });
    const heart = screen.getByRole('img', { name: '제작팀의 하트' });
    // 댓글 아이콘이 하트보다 앞에 온다
    expect(button.compareDocumentPosition(heart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
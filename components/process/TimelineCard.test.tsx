import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimelineCard } from './TimelineCard';
import type { TimelineEvent } from '@/content/types';

const events = (n: number): TimelineEvent[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    period: `26.0${(i % 9) + 1}`,
    title: `일정 ${i + 1}`,
    status: '완료' as const,
    sortOrder: i,
  }));

describe('TimelineCard', () => {
  it('shows only the first five by default', () => {
    render(<TimelineCard title="지나온 이야기" note="완료된 일정" events={events(9)} tone="past" />);
    expect(screen.getByText('일정 5')).toBeInTheDocument();
    expect(screen.queryByText('일정 6')).not.toBeInTheDocument();
  });

  it('counts the remaining items instead of the design’s hardcoded 4', () => {
    render(<TimelineCard title="앞으로" note="진행 중인 일정" events={events(11)} tone="ahead" />);
    expect(screen.getByRole('button', { name: /외 6개의 기록 더보기/ })).toBeInTheDocument();
  });

  it('reveals the rest when expanded', async () => {
    const user = userEvent.setup();
    render(<TimelineCard title="지나온 이야기" note="완료된 일정" events={events(9)} tone="past" />);
    await user.click(screen.getByRole('button', { name: /더보기/ }));
    expect(screen.getByText('일정 9')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /더보기/ })).not.toBeInTheDocument();
  });

  it('hides the toggle when everything already fits', () => {
    render(<TimelineCard title="지나온 이야기" note="완료된 일정" events={events(3)} tone="past" />);
    expect(screen.queryByRole('button', { name: /더보기/ })).not.toBeInTheDocument();
  });

  it('says so when a section has no events at all', () => {
    render(<TimelineCard title="앞으로" note="진행 중인 일정" events={[]} tone="ahead" />);
    expect(screen.getByText('등록된 일정이 없습니다.')).toBeInTheDocument();
  });
});

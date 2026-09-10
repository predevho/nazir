import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProcessSectionPage from './page';
import { content } from '@/content/data';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  // 스와이프 네비게이터가 쓴다. 이 테스트에서는 실제 이동을 검증하지 않는다.
  useRouter: () => ({ push: vi.fn() }),
}));

const show = async (slug: string) =>
  render(await ProcessSectionPage({ params: Promise.resolve({ slug }) }));

describe('ProcessSectionPage', () => {
  it('splits the timeline into 완료 and 진행 중·예정 cards', async () => {
    await show('schedule');
    expect(screen.getByRole('heading', { name: /지나온 이야기/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /앞으로 걸어갈 이야기/ })).toBeInTheDocument();
  });

  it('previews five per card and offers the rest behind 더보기', async () => {
    await show('schedule');
    const done = content.timeline.filter((t) => t.status === '완료').length;
    const rest = content.timeline.length - done;
    expect(screen.getByRole('button', { name: `⌄ 외 ${done - 5}개의 기록 더보기` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `⌄ 외 ${rest - 5}개의 기록 더보기` })).toBeInTheDocument();
  });

  it('shows the budget total and item names without amounts', async () => {
    await show('budget');
    expect(screen.getByText(/총 제작 예산/)).toBeInTheDocument();
    expect(screen.getByText('기획 및 홍보')).toBeInTheDocument();
    expect(screen.getByText('예비비')).toBeInTheDocument();
    expect(screen.queryByText('미공개')).not.toBeInTheDocument();
  });

  it('marks the current dot on each sub page', async () => {
    await show('budget');
    expect(screen.getByRole('link', { name: '02 제작 예산' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('404s on an unknown slug', async () => {
    await expect(show('nope')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

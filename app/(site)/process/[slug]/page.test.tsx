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
  usePathname: () => '/',
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

  it('keeps the budget list at two columns and gives every row but the first a divider', async () => {
    // 예전에는 sm 미만에서 1열로 떨어뜨리면서도 구분선은 2열 기준(i >= 2)으로 그렸다.
    // 그 결과 모바일에서는 3번째 항목 앞에만 선이 생겼다.
    const { container } = await show('budget');
    const list = [...container.querySelectorAll('ul')].find((u) => u.children.length === 8)!;
    expect(list.className).toContain('grid-cols-2');
    expect(list.className).not.toContain('sm:grid-cols');

    const cells = [...list.children];
    // 첫 줄(0·1)만 윗선이 없고 나머지는 모두 있다
    expect(cells.filter((c) => c.className.includes('border-t-')).length).toBe(cells.length - 2);
    expect(cells[0].className).not.toContain('border-t-');
    expect(cells[1].className).not.toContain('border-t-');
    // 왼쪽 칸에만 세로선. 마지막 칸이 왼쪽에 홀로 남으면 갈 곳 없는 선이라 빼야 한다
    expect(cells[0].className).toContain('border-r-');
    expect(cells[1].className).not.toContain('border-r-');
    expect(cells[cells.length - 1].className).not.toContain('border-r-');
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

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutSectionPage from './page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const show = async (slug: string) =>
  render(await AboutSectionPage({ params: Promise.resolve({ slug }) }));

describe('AboutSectionPage', () => {
  it('renders 01 연출의 인사말 with the greeting copy', async () => {
    await show('greeting');
    expect(screen.getByRole('heading', { level: 1, name: '연출의 인사말' })).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('renders 03 작품 소개 with 개요 · 로그라인 · 시놉시스 in the design order', async () => {
    await show('work');
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['작품 개요', '로그라인', '시놉시스']);
    expect(screen.getByText(/평생의 목표였던 오디션에서 탈락/)).toBeInTheDocument();
  });

  it('does not repeat the logline in both columns on 03', async () => {
    await show('work');
    expect(screen.getAllByText(/버린 노래를 통해 하나님의 뜻과/)).toHaveLength(1);
  });

  it('renders all six characters on 04 작품 속 인물', async () => {
    await show('characters');
    expect(screen.getByRole('heading', { level: 1, name: '작품 속 인물' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '아론' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '라이' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6);
  });

  it('shows a character photo only once one has been uploaded', async () => {
    await show('characters');
    // 시드는 전원 photoUrl null 이라 지금은 사진 없이 시안과 같은 모습이어야 한다
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('marks the current dot on each sub page', async () => {
    await show('praysound');
    expect(screen.getByRole('link', { name: '02 Praysound에 대하여' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('404s on an unknown slug', async () => {
    await expect(show('nope')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

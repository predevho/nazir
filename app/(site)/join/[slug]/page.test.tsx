import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import JoinSectionPage from './page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
  // 스와이프 네비게이터가 쓴다. 이 테스트에서는 실제 이동을 검증하지 않는다.
  useRouter: () => ({ push: vi.fn() }),
}));

const show = async (slug: string) =>
  render(await JoinSectionPage({ params: Promise.resolve({ slug }) }));

describe('JoinSectionPage', () => {
  it('renders 01 후원으로 함께하기 with the form link and account number', async () => {
    await show('support');
    expect(screen.getByRole('heading', { level: 1, name: '후원으로 함께하기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '후원 신청서 작성하기' })).toHaveAttribute(
      'href',
      'https://forms.gle/dtEFEf2E1ArqGEwH6',
    );
    expect(screen.getByText('3333-23-3584437')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '계좌번호 복사' })).toBeInTheDocument();
  });

  it('renders 02 기도로 동참하기 with the six prayers numbered', async () => {
    await show('prayer');
    expect(screen.getByRole('heading', { level: 1, name: '기도로 동참하기' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '기도 제목' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(6 + 2); // 기도 6 + 도트 2
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('06')).toBeInTheDocument();
  });

  it('cites 전도서 4:12, not the 4:22 typo in the design', async () => {
    await show('support');
    expect(screen.getByText('전도서 4:12')).toBeInTheDocument();
  });

  it('marks the current dot on each sub page', async () => {
    await show('prayer');
    expect(screen.getByRole('link', { name: '02 기도로 동참하기' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('404s on an unknown slug', async () => {
    await expect(show('nope')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

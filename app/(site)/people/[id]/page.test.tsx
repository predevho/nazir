import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PersonPage from './page';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const show = async (id: string) => render(await PersonPage({ params: Promise.resolve({ id }) }));

describe('PersonPage', () => {
  it('shows the group, team and role above the name', async () => {
    const { container } = await show('g0m0');
    expect(screen.getByRole('heading', { level: 1, name: '정은수' })).toBeInTheDocument();
    expect(container.textContent).toContain('헤더진');
  });

  it('links back to the tab the person came from', async () => {
    await show('g0m0');
    expect(screen.getByRole('link', { name: /함께하는 사람들/ })).toHaveAttribute(
      'href',
      `/people?tab=${encodeURIComponent('헤더진')}`,
    );
  });

  it('says the profile is still being prepared instead of leaving the column blank', async () => {
    // 지금 43명 전원이 사진·한 줄 소개·약력 없이 이름만 있다.
    // 아무 말도 없으면 만들다 만 화면처럼 보인다.
    await show('g1m0');
    expect(screen.getByText('소개가 아직 준비되지 않았습니다.')).toBeInTheDocument();
  });

  it('keeps to the house rules the rest of the site follows', async () => {
    // 이 화면만 예전 규칙(max-w-[820px]·font-mono·11px 라벨)으로 남아 있었다.
    const { container } = await show('g0m0');
    const section = container.querySelector('section')!;
    expect(section.className).toContain('max-w-content');
    expect(section.className).toContain('px-6');
    expect(container.innerHTML).not.toContain('font-mono');
  });

  it('caps the photo box so it does not balloon when the columns stack', async () => {
    // xl 미만은 한 줄로 쌓인다. 폭을 풀어 두면 768 에서 720×933 짜리 빈 상자가 된다.
    const { container } = await show('g0m0');
    const photo = container.querySelector('div[class*="aspect-"]')!;
    expect(photo.className).toContain('max-w-[320px]');
  });

  it('404s on an unknown id', async () => {
    await expect(show('nope')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

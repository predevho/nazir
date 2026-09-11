import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PeoplePage from './page';

const render_ = async (tab?: string) =>
  render(await PeoplePage({ searchParams: Promise.resolve(tab ? { tab } : {}) }));

describe('PeoplePage', () => {
  it('renders the title and the three tabs from the design', async () => {
    await render_();
    expect(screen.getByRole('heading', { name: '함께하는 사람들' })).toBeInTheDocument();
    for (const label of ['헤더진', '스탭진', '배우']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('defaults to 헤더진 and shows its members', async () => {
    await render_();
    expect(screen.getByRole('link', { name: '헤더진' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /정은수/ })).toHaveAttribute('href', '/people/g0m0');
  });

  it('switches the grid with the tab query', async () => {
    await render_('배우');
    expect(screen.getByRole('link', { name: '배우' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /정주은/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /권도원/ })).not.toBeInTheDocument();
  });

  it('falls back to the first tab for an unknown query', async () => {
    await render_('없는탭');
    expect(screen.getByRole('link', { name: '헤더진' })).toHaveAttribute('aria-current', 'page');
  });

  it('제목 아래 소개 문단은 고딕(font-desc)이다', async () => {
    const { container } = await render_();
    expect(container.querySelector('.font-desc')).toHaveClass('font-extralight');
  });
});

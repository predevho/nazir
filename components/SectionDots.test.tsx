import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionDots } from './SectionDots';
import { ABOUT_SECTIONS } from '../content/about';
import { JOIN_SECTIONS } from '../content/join';

describe('SectionDots', () => {
  it('renders one dot per sub page', () => {
    render(
      <SectionDots items={ABOUT_SECTIONS} activeSlug="greeting" basePath="/about" label="대하여" />,
    );
    // 도트 4개 + 다음 화살표. 첫 장이라 이전 화살표는 링크가 아니다.
    const dots = screen.getAllByRole('link').filter((a) => /^0\d /.test(a.getAttribute('aria-label') ?? ''));
    expect(dots).toHaveLength(4);
  });

  it('marks the current page, not always the first one', () => {
    render(
      <SectionDots items={ABOUT_SECTIONS} activeSlug="work" basePath="/about" label="대하여" />,
    );
    expect(screen.getByRole('link', { name: '03 작품 소개' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '01 연출의 인사말' })).not.toHaveAttribute('aria-current');
  });

  it('offers prev/next arrows to the neighbouring pages (명세 9행)', () => {
    render(
      <SectionDots items={ABOUT_SECTIONS} activeSlug="praysound" basePath="/about" label="대하여" />,
    );
    expect(screen.getByRole('link', { name: '이전: 01 연출의 인사말' })).toHaveAttribute(
      'href',
      '/about/greeting',
    );
    expect(screen.getByRole('link', { name: '다음: 03 작품 소개' })).toHaveAttribute(
      'href',
      '/about/work',
    );
  });

  it('drops the arrow at each end instead of linking nowhere', () => {
    const { unmount } = render(
      <SectionDots items={ABOUT_SECTIONS} activeSlug="greeting" basePath="/about" label="대하여" />,
    );
    expect(screen.queryByRole('link', { name: /^이전:/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^다음:/ })).toBeInTheDocument();
    unmount();

    render(
      <SectionDots items={ABOUT_SECTIONS} activeSlug="characters" basePath="/about" label="대하여" />,
    );
    expect(screen.getByRole('link', { name: /^이전:/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^다음:/ })).not.toBeInTheDocument();
  });

  it('gives every dot an accessible label since it has no text', () => {
    render(
      <SectionDots items={JOIN_SECTIONS} activeSlug="support" basePath="/join" label="후원과 기도" />,
    );
    expect(screen.getByRole('link', { name: '01 후원으로 함께하기' })).toHaveAttribute(
      'href',
      '/join/support',
    );
    expect(screen.getByRole('link', { name: '02 기도로 동참하기' })).toHaveAttribute(
      'href',
      '/join/prayer',
    );
  });
});

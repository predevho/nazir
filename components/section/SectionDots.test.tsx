import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionDots } from './SectionDots';
import { ABOUT_SECTIONS } from '@/content/about';
import { JOIN_SECTIONS } from '@/content/join';

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

  it('centres the row on phones, where the arrows are gone and it would look lopsided', () => {
    // 모바일은 화살표가 없어 도트 4개가 168px 만 쓴다. 왼쪽에 붙이면 오른쪽이 174px 빈다.
    // md 이상은 시안대로 좌측 제목 블록 아래에 선다.
    const { container } = render(
      <SectionDots items={ABOUT_SECTIONS} activeSlug="work" basePath="/about" label="대하여" />,
    );
    const nav = container.querySelector('nav')!;
    expect(nav.className).toContain('justify-center');
    expect(nav.className).toContain('md:justify-start');
  });

  it('keeps every dot and arrow inside a finger-sized tap area', () => {
    // 도트는 시안대로 18px로 그린다. 그 크기 그대로 두면 휴대폰에서 누르기 어려워
    // .tap-target 이 가상 요소로 눌리는 범위만 44px로 넓힌다(app/globals.css).
    // 클래스가 빠지면 화면상으로는 아무 차이가 없어 눈으로는 못 잡는다.
    render(
      <SectionDots items={ABOUT_SECTIONS} activeSlug="praysound" basePath="/about" label="대하여" />,
    );
    for (const link of screen.getAllByRole('link')) {
      expect(link.className).toContain('tap-target');
    }
  });
});

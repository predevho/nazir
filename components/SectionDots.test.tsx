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
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('marks the current page, not always the first one', () => {
    render(
      <SectionDots items={ABOUT_SECTIONS} activeSlug="work" basePath="/about" label="대하여" />,
    );
    expect(screen.getByRole('link', { name: '03 작품 소개' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '01 연출의 인사말' })).not.toHaveAttribute('aria-current');
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

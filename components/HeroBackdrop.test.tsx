import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroBackdrop } from './HeroBackdrop';

describe('HeroBackdrop', () => {
  it('renders the title, subtitle and passed verse', () => {
    render(<HeroBackdrop verse="테스트 성구" meta={'첫째 줄\n둘째 줄'} />);
    expect(screen.getByRole('heading', { level: 1, name: '나지르' })).toBeInTheDocument();
    expect(screen.getByText('구별된 사람들')).toBeInTheDocument();
    expect(screen.getByText('테스트 성구')).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Join from './page';

describe('Join', () => {
  it('shows account number and external links', async () => {
    render(await Join());
    expect(screen.getByText('3333-23-3584437')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /후원 신청서/ })).toHaveAttribute('href', 'https://forms.gle/dtEFEf2E1ArqGEwH6');
    expect(screen.getByRole('link', { name: /질문 · 응원 남기기/ })).toBeInTheDocument();
  });
});

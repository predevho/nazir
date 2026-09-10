import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Process from './page';

describe('Process', () => {
  it('shows the production timeline with a status chip', async () => {
    render(await Process());
    expect(screen.getByText('대본 작업')).toBeInTheDocument();
    expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
  });
  it('shows the budget total', async () => {
    render(await Process());
    expect(screen.getByText('₩ 9,000,000')).toBeInTheDocument();
  });
  it('sends people to their own route instead of listing them here', async () => {
    render(await Process());
    expect(screen.getByRole('link', { name: /함께하는 사람들 보기/ })).toHaveAttribute('href', '/people');
    expect(screen.queryByText('정은수')).not.toBeInTheDocument();
  });
});

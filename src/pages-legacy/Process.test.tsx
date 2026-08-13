import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Process from './Process';

describe('Process', () => {
  it('renders the production timeline with a status chip', async () => {
    render(<Process />);
    expect(await screen.findByText('대본 작업')).toBeInTheDocument();
    expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
  });
  it('shows budget total and expands a people group', async () => {
    render(<Process />);
    expect(await screen.findByText('₩ 9,000,000')).toBeInTheDocument();
    expect(await screen.findByText(/연출 정은수/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /팀원/ }));
    expect(screen.getByText(/기획팀 김은성/)).toBeInTheDocument();
  });
});

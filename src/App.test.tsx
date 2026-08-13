import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('routing', () => {
  it('renders the about heading at /about', async () => {
    renderAt('/about');
    expect(await screen.findByRole('heading', { name: /나지르.*에 대하여/ })).toBeInTheDocument();
  });
  it('renders the join heading at /join', async () => {
    renderAt('/join');
    expect(await screen.findByRole('heading', { name: /함께하기/, level: 2 })).toBeInTheDocument();
  });
});

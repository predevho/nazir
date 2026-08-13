import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home', () => {
  it('renders title and three section cards', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>);
    expect(screen.getByRole('heading', { level: 1, name: '나지르' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /에 대하여/ })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /무대에 오르기까지/ })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /함께하기/ })).toBeInTheDocument();
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home', () => {
  it('renders hero title and three section links', async () => {
    render(await Home());
    expect(screen.getByRole('heading', { level: 1, name: '나지르' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /에 대하여/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /무대에 오르기까지/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /함께하기/ })).toBeInTheDocument();
  });
});

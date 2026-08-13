import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from './page';

describe('About', () => {
  it('renders synopsis and all six characters', async () => {
    render(await About());
    expect(screen.getByText(/평생의 목표였던 오디션에서 탈락/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '아론' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '라이' })).toBeInTheDocument();
  });
});

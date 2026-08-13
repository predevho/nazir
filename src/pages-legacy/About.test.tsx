import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import About from './About';

describe('About', () => {
  it('renders synopsis and all six characters', async () => {
    render(<About />);
    expect(await screen.findByText(/평생의 목표였던 오디션에서 탈락/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '아론' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '라이' })).toBeInTheDocument();
  });
});

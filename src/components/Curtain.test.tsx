import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Curtain } from './Curtain';

afterEach(() => vi.useRealTimers());

describe('Curtain', () => {
  it('removes itself after the opening delay', () => {
    vi.useFakeTimers();
    render(<Curtain />);
    expect(screen.getByTestId('curtain')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1800));
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });
});

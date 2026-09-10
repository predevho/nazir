import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Curtain } from './Curtain';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

afterEach(() => vi.useRealTimers());

describe('Curtain', () => {
  it('removes itself after the opening delay', () => {
    vi.useFakeTimers();
    render(<Curtain />);
    expect(screen.getByTestId('curtain')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2400));
    expect(screen.queryByTestId('curtain')).not.toBeInTheDocument();
  });
});

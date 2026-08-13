import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Process from './page';

describe('Process', () => {
  it('renders timeline, a status chip, and budget total', async () => {
    render(await Process());
    expect(screen.getByText('대본 작업')).toBeInTheDocument();
    expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
    expect(screen.getByText('₩ 9,000,000')).toBeInTheDocument();
    expect(screen.getByText(/연출 정은수/)).toBeInTheDocument();
  });
});

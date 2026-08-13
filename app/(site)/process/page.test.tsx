import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Process from './page';

describe('Process', () => {
  it('shows the production timeline with a status chip', async () => {
    render(await Process());
    expect(screen.getByText('대본 작업')).toBeInTheDocument();
    expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
  });
  it('shows people as individuals and budget total', async () => {
    render(await Process());
    expect(screen.getByText('₩ 9,000,000')).toBeInTheDocument();
    // 헤더진(기본 펼침)의 개인 이름
    expect(screen.getByText('정은수')).toBeInTheDocument();
    expect(screen.getByText('연출')).toBeInTheDocument();
  });
});

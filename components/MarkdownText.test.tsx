import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownText } from './MarkdownText';

describe('MarkdownText', () => {
  it('불릿 마크다운을 리스트로 렌더한다', () => {
    render(<MarkdownText>{'- 항목1\n- 항목2'}</MarkdownText>);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('항목1')).toBeInTheDocument();
  });
  it('강조(**)를 strong으로 렌더한다', () => {
    render(<MarkdownText>{'**굵게**'}</MarkdownText>);
    expect(screen.getByText('굵게').tagName).toBe('STRONG');
  });
  it('빈 값이면 아무것도 렌더하지 않는다', () => {
    const { container } = render(<MarkdownText>{'   '}</MarkdownText>);
    expect(container.firstChild).toBeNull();
  });
});

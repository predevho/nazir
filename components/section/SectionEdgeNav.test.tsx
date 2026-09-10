import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { SectionEdgeNav } from './SectionEdgeNav';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

/**
 * jsdom 에는 IntersectionObserver 가 없다. 콜백을 붙잡아 두었다가 테스트가 직접
 * "푸터가 보인다/안 보인다"를 흘려 넣는다. 브라우저 미리보기 패널에서는 rAF·scroll·IO 가
 * 모두 발화하지 않아 이 동작을 눈으로 확인할 수 없어, 검증을 여기로 옮겼다.
 */
let fire: ((visible: boolean) => void) | null = null;

beforeEach(() => {
  fire = null;
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private cb: (entries: { isIntersecting: boolean }[]) => void) {
        fire = (visible) => this.cb([{ isIntersecting: visible }]);
      }
      observe() {}
      disconnect() {}
    },
  );
  document.body.innerHTML = '<footer>푸터</footer>';
});

const both = {
  prev: { href: '/about/greeting', label: '01 연출의 인사말' },
  next: { href: '/about/work', label: '03 작품 소개' },
};

describe('SectionEdgeNav', () => {
  it('offers both directions in the middle of a section', () => {
    render(<SectionEdgeNav neighbors={both} />);
    expect(screen.getByRole('link', { name: '이전: 01 연출의 인사말' })).toHaveAttribute(
      'href',
      '/about/greeting',
    );
    expect(screen.getByRole('link', { name: '다음: 03 작품 소개' })).toHaveAttribute(
      'href',
      '/about/work',
    );
  });

  it('drops the missing side on the first and last page', () => {
    const { unmount } = render(<SectionEdgeNav neighbors={{ next: both.next }} />);
    expect(screen.queryByRole('link', { name: /^이전:/ })).not.toBeInTheDocument();
    unmount();
    render(<SectionEdgeNav neighbors={{ prev: both.prev }} />);
    expect(screen.queryByRole('link', { name: /^다음:/ })).not.toBeInTheDocument();
  });

  it('renders nothing at all when a section has no neighbours', () => {
    const { container } = render(<SectionEdgeNav neighbors={{}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('gets out of the way once the footer comes into view', () => {
    // 페이지 끝까지 내려온 사람은 다음 장이 아니라 연락처·후원 링크를 보는 중이다.
    const { container } = render(<SectionEdgeNav neighbors={both} />);
    const wrap = container.firstElementChild as HTMLElement;

    expect(wrap.className).toContain('opacity-100');
    expect(wrap.getAttribute('aria-hidden')).toBe('false');

    act(() => fire!(true));
    expect(wrap.className).toContain('opacity-0');
    expect(wrap.getAttribute('aria-hidden')).toBe('true');

    act(() => fire!(false));
    expect(wrap.className).toContain('opacity-100');
  });

  it('only shows from 2xl up, where the buttons fit outside the 1398px content column', () => {
    // 그 아래 폭에서는 화면 끝 버튼이 본문 카드를 덮는다(768·1024 에서 36px).
    // 좁은 쪽은 SectionDots 안의 화살표가, 모바일은 스와이프와 코치마크가 맡는다.
    const { container } = render(<SectionEdgeNav neighbors={both} />);
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.className).toContain('hidden');
    expect(wrap.className).toContain('2xl:flex');
    expect(wrap.className).not.toContain('md:flex');
  });
});

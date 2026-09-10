import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Chevron } from './Chevron';

describe('Chevron', () => {
  it('draws the arrow instead of relying on a font glyph', () => {
    const { container } = render(<Chevron dir="left" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toBeInTheDocument();
    expect(svg.querySelector('polyline')).toBeInTheDocument();
    // 색과 크기는 쓰는 쪽을 따라간다
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('class')).toContain('h-[1em]');
  });

  it('points the two directions at different shapes', () => {
    const l = render(<Chevron dir="left" />).container.querySelector('polyline')!.getAttribute('points');
    const r = render(<Chevron dir="right" />).container.querySelector('polyline')!.getAttribute('points');
    expect(l).not.toBe(r);
  });

  it('stays out of the accessibility tree — 옆의 aria-label 이 뜻을 전한다', () => {
    const { container } = render(<Chevron dir="right" />);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});

/**
 * 시안 폰트 Heir of Light 는 `‹`(U+2039)·`›`(U+203A)를 **빈 글리프**로 갖고 있다.
 * cmap 에 있으니 브라우저는 대체 폰트로 넘기지 않고, 자리만 차지한 채 아무것도
 * 그리지 않는다. 화면에는 빈 버튼으로 보이는데 DOM 에는 글자가 있어서, 테스트로도
 * 스크린샷으로도 좀처럼 걸리지 않는다. 그래서 소스에 다시 들어오는 것을 막는다.
 */
describe('빈 글리프로 그려지는 문자가 다시 들어오지 않도록', () => {
  const BLANK_IN_HEIR = /[‹›]/;

  function sources(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) return sources(p);
      return p.endsWith('.tsx') && !p.endsWith('.test.tsx') ? [p] : [];
    });
  }

  it('components 어디에도 ‹ › 를 직접 쓰지 않는다', () => {
    const offenders = sources('components').filter((p) => {
      // 설명하는 주석에는 쓸 수 있어야 하므로 블록 주석은 걷어내고 본다
      const code = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      return BLANK_IN_HEIR.test(code);
    });
    expect(offenders).toEqual([]);
  });
});

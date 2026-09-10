/**
 * 이전·다음을 가리키는 화살표.
 *
 * 원래는 `‹`(U+2039)·`›`(U+203A) 글자를 그대로 썼는데, 화면에서는 버튼이 비어 보였다.
 * 시안 폰트 Heir of Light 가 이 두 코드포인트를 **빈 글리프**로 갖고 있는 탓이다.
 * cmap 에 등록은 되어 있으니 브라우저는 "이 폰트에 있다"고 보고 대체 폰트로 넘기지
 * 않는다. 그래서 자리만 차지한 채 아무것도 그려지지 않는다
 * (캔버스에 100px 로 찍어 세어 보면 칠해진 픽셀이 0이다. `«`·`⌄`·한글은 정상).
 *
 * 글꼴 사정에 좌우되지 않도록 도형으로 그린다. 크기는 1em 이라 쓰는 쪽의
 * `text-[20px]` 같은 지정을 그대로 따르고, 색은 `currentColor` 를 물려받는다.
 */
export function Chevron({ dir, className }: { dir: 'left' | 'right'; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      className={`h-[1em] w-[1em] ${className ?? ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points={dir === 'left' ? '15 5 8 12 15 19' : '9 5 16 12 9 19'} />
    </svg>
  );
}

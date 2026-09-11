/**
 * 쪽지 하단 왼쪽의 제작팀 하트. 시안에는 하트 자리가 없어 댓글 아이콘(`CommentIcon`)과
 * 같은 크기·같은 방식으로 그린다. 색은 currentColor — 쓰는 쪽이 정한다.
 */
export function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 21 21"
      aria-hidden
      focusable="false"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10.5 18.6l-1.16-1.06C5.12 13.72 2.3 11.16 2.3 8.02 2.3 5.46 4.3 3.5 6.86 3.5c1.45 0 2.84.68 3.64 1.75.8-1.07 2.19-1.75 3.64-1.75 2.56 0 4.56 1.96 4.56 4.52 0 3.14-2.82 5.7-7.04 9.53L10.5 18.6z" />
    </svg>
  );
}

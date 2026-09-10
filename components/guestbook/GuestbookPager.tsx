import Link from 'next/link';
import { Chevron } from '@/components/ui/Chevron';

/**
 * 응원글 페이지 이동. 시안에는 게시판 페이지네이션 UI가 없어(명세에도 규칙이 없다)
 * 편지 캐러셀의 `‹ 1 / N ›` 표기를 그대로 가져왔다. 같은 파일 안에서 이미 쓰는 어휘다.
 *
 * 버튼이 아니라 링크라 공유·뒤로가기가 그대로 동작하고, 글을 남긴 뒤
 * 서버가 다시 그려도 어긋날 상태가 없다.
 */
export function GuestbookPager({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const href = (n: number) => (n === 1 ? '/guestbook' : `/guestbook?page=${n}`);

  return (
    <nav
      aria-label="응원글 페이지"
      className="mt-[clamp(32px,5vw,56px)] flex items-center justify-center gap-6 font-heir text-[15px] text-ds-text"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} aria-label="이전 페이지" className="tap-target px-2 hover:text-ds-key2">
          <Chevron dir="left" />
        </Link>
      ) : (
        <span aria-hidden className="px-2 text-ds-text/25">
          <Chevron dir="left" />
        </span>
      )}
      <span>
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={href(page + 1)} aria-label="다음 페이지" className="tap-target px-2 hover:text-ds-key2">
          <Chevron dir="right" />
        </Link>
      ) : (
        <span aria-hidden className="px-2 text-ds-text/25">
          <Chevron dir="right" />
        </span>
      )}
    </nav>
  );
}

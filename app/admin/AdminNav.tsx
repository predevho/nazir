import Link from 'next/link';

/**
 * 관리자 편집 화면 상단 네비.
 *
 * 관리자 허브(`/admin`)로만 간다. 공개 사이트로 나가는 길은 두지 않는다 —
 * 편집 중에 눌러 공개 화면으로 튕기면 하던 자리를 잃고, 관리자 화면에서
 * 필요한 이동은 전부 `/admin` 안에서 끝난다.
 */
export function AdminNav() {
  return (
    <nav className="flex items-center gap-4">
      <Link href="/admin" className="text-[11px] text-ds-key2 hover:opacity-80">← 관리자</Link>
    </nav>
  );
}

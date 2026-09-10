import Link from 'next/link';

/** 관리자 편집 화면 상단 네비: 관리자 허브(/admin)와 사이트 홈(/)으로 이동. */
export function AdminNav() {
  return (
    <nav className="flex items-center gap-4">
      <Link href="/admin" className="font-mono text-[11px] text-ds-key2 hover:opacity-80">← 관리자</Link>
      <Link href="/" className="font-mono text-[11px] text-ds-text/55 hover:opacity-80">홈 ↗</Link>
    </nav>
  );
}

import Link from 'next/link';

/**
 * 관리자 화면 껍데기.
 *
 * 상단 배너는 **관리자 허브(`/admin`)** 로 간다. 공개 사이트가 아니다 —
 * 관리자 화면에서 로고를 누르면 관리자 홈으로 가는 것이 관례고, 공개 사이트로
 * 튕기면 하던 작업 자리를 잃는다. 관리자 화면에서 공개 사이트로 나가는 링크는
 * 따로 두지 않는다.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-ds-key2/15 px-5 py-4">
        <Link href="/admin" className="inline-flex items-baseline hover:opacity-80" aria-label="관리자 홈">
          <span className="font-heir text-lg text-ds-key2">나지르</span>
          <span className="ml-2 font-mono text-[10px] tracking-[0.2em] text-ds-text/40">ADMIN</span>
        </Link>
      </div>
      {children}
    </div>
  );
}

import './globals.css';
import type { Metadata } from 'next';
import { getSiteUrl } from '@/lib/siteUrl';

const title = '나지르 · 구별된 사람들';
const description =
  '창작뮤지컬 〈나지르〉 — 실패로 신앙을 잃은 청년이 버린 노래를 통해 자신의 사명을 다시 발견한다. 제작 과정과 후원 안내를 공개합니다. 제작 PRAYSOUND.';

/**
 * 이 사이트는 카톡·인스타로 링크가 퍼지는 것이 주 유입이라 공유 카드가 중요하다.
 * 그래서 OG/트위터 카드를 루트에 깔고, 각 페이지는 title만 덮어쓴다.
 *
 * `metadataBase`가 없으면 OG 이미지가 상대 경로로 나가 스크래퍼가 못 읽는다.
 * 도메인은 lib/siteUrl.ts 참고 — 배포 전에 NEXT_PUBLIC_SITE_URL 을 채우는 것이 가장 확실하다.
 */
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: title, template: '%s · 나지르' },
  description,
  applicationName: '나지르',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '나지르',
    // title·description을 여기 고정하면 서브페이지를 공유해도 홈 제목이 나간다.
    // 비워두면 각 페이지의 title·description이 그대로 og로 올라간다.
    url: '/',
    images: [{ url: '/images/og.jpg', width: 1200, height: 630, alt: '창작뮤지컬 〈나지르〉' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/og.jpg'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      {/*
        Google Fonts 링크를 제거했다. 공개 화면은 시안 폰트(Heir of Light · Griun Gossi)만
        쓰고, 그 둘은 public/fonts/ 에서 자체 호스팅한다. 관리자 화면은 시스템 폰트로 충분하다.
        본문 폰트가 따로 확정되면(코멘트 #38) 그때 그 폰트만 preload로 추가한다.
      */}
      <body className="bg-ds-bg text-ds-text min-h-screen overflow-x-hidden">{children}</body>
    </html>
  );
}

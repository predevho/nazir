import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '나지르 · 구별된 사람들',
  description: '창작 뮤지컬 〈나지르〉 — 구별된 사람들. 제작 PRAYSOUND.',
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

import './globals.css';
import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Curtain } from '@/components/Curtain';
import { getContent } from '@/lib/content';

export const metadata: Metadata = {
  title: '나지르 · 구별된 사람들',
  description: '창작 뮤지컬 〈나지르〉 — 구별된 사람들. 제작 PRAYSOUND.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getContent();
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-stage text-paper min-h-screen overflow-x-hidden">
        <Curtain />
        <Header />
        <main className="min-h-[60vh]">{children}</main>
        <Footer site={site} />
      </body>
    </html>
  );
}

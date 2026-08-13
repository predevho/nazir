import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Curtain } from '@/components/Curtain';
import { getContent } from '@/lib/content';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getContent();
  return (
    <>
      <Curtain />
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer site={site} />
    </>
  );
}

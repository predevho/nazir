import { Header } from '@/components/shell/Header';
import { Footer } from '@/components/shell/Footer';
import { Curtain } from '@/components/shell/Curtain';
import { VisitBeacon } from '@/components/shell/VisitBeacon';
import { getContent } from '@/lib/content';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site } = await getContent();
  return (
    <>
      <VisitBeacon />
      <Curtain />
      <Header supportFormUrl={site.supportFormUrl} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer site={site} />
    </>
  );
}

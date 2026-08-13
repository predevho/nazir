import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useContent } from '../lib/useContent';

export function Layout({ children }: { children: ReactNode }) {
  const state = useContent();
  const site = state.status === 'ready' ? state.data.site : undefined;
  return (
    <div className="bg-stage text-paper min-h-screen overflow-x-hidden">
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer site={site} />
    </div>
  );
}

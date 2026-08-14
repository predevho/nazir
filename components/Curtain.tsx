'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function Curtain() {
  const pathname = usePathname();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 1700);
    return () => clearTimeout(t);
  }, []);
  if (pathname.startsWith('/admin')) return null;
  if (!on) return null;
  return (
    <div data-testid="curtain" className="fixed inset-0 z-[200] pointer-events-none">
      <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-[#2E0709] to-[#6A1017] animate-curtainL shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#2E0709] to-[#6A1017] animate-curtainR shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
    </div>
  );
}

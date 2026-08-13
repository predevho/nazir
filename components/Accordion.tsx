'use client';

import { useState, type ReactNode } from 'react';

export function Accordion({ label, defaultOpen = false, children }: {
  label: string; defaultOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-velvet">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-[18px] py-4 flex justify-between items-center gap-3 text-left text-paper hover:bg-gold/[0.08] transition-colors"
      >
        <span className="font-display text-[18px]">{label}</span>
        <span className="font-mono text-sm text-gold">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-[18px] pb-5 flex flex-col gap-2.5">{children}</div>}
    </div>
  );
}

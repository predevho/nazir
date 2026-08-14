'use client';

import { useState, useEffect, type ReactNode } from 'react';

export function Accordion({ label, defaultOpen = false, children }: {
  label: string; defaultOpen?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const storageKey = `nz_acc_${label}`;

  // 세션 동안 열림/닫힘 유지: 다른 페이지로 이동했다 돌아와도 상태 보존.
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved !== null) setOpen(saved === '1');
  }, [storageKey]);

  function toggle() {
    setOpen((o) => {
      const next = !o;
      try {
        sessionStorage.setItem(storageKey, next ? '1' : '0');
      } catch {
        // sessionStorage 불가 환경 무시
      }
      return next;
    });
  }

  return (
    <div className="bg-velvet">
      <button
        type="button"
        onClick={toggle}
        className="w-full px-[18px] py-4 flex justify-between items-center gap-3 text-left text-paper hover:bg-gold/[0.08] transition-colors"
      >
        <span className="font-display text-[18px]">{label}</span>
        <span className="font-mono text-sm text-gold">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-[18px] pb-5 flex flex-col gap-2.5">{children}</div>}
    </div>
  );
}

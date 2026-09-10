'use client';

import { useRef, useState } from 'react';

export function CopyButton({ value, idleLabel, doneLabel, className }: {
  value: string; idleLabel: string; doneLabel: string; className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  async function copy() {
    try {
      await navigator.clipboard?.writeText(value);
    } finally {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={className ?? 'min-h-[48px] cursor-pointer bg-ds-key2/[0.12] border border-ds-key2/50 text-ds-key2 text-sm font-medium rounded-sm hover:bg-ds-key2/20 transition-colors'}
    >
      {copied ? doneLabel : idleLabel}
    </button>
  );
}

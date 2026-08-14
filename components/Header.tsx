"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { to: "/about", label: "The Work" },
  { to: "/process", label: "In the Making" },
  { to: "/join", label: "Join Us" },
];

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-[100] bg-stage/85 backdrop-blur-md border-b border-gold/15">
      <nav className="max-w-[1180px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-baseline gap-2 text-paper shrink-0"
        >
          <span className="font-display text-[22px] tracking-[0.06em] text-gold whitespace-nowrap">
            나지르
          </span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-paper/50 hidden sm:inline">
            NAZIR
          </span>
        </Link>
        <div className="flex gap-0.5 sm:gap-1">
          {items.map((it) => (
            <Link
              key={it.to}
              href={it.to}
              aria-current={pathname === it.to ? "page" : undefined}
              className={`font-body text-[12px] sm:text-[13px] px-2 sm:px-2.5 py-2 rounded-md whitespace-nowrap transition-colors hover:text-gold hover:bg-gold/[0.08] ${pathname === it.to ? "text-gold" : "text-paper/70"}`}
            >
              {it.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}

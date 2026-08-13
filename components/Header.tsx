import { Link, NavLink } from 'react-router-dom';

const items = [
  { to: '/about', label: '대하여' },
  { to: '/process', label: '무대에 오르기까지' },
  { to: '/join', label: '함께하기' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-[100] bg-stage/85 backdrop-blur-md border-b border-gold/15">
      <nav className="max-w-[1180px] mx-auto px-5 py-3.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-2 text-paper shrink-0">
          <span className="font-display text-[22px] tracking-[0.06em] text-gold whitespace-nowrap">나지르</span>
          <span className="font-mono text-[10px] tracking-[0.18em] text-paper/50 hidden sm:inline">NAZIR</span>
        </Link>
        <div className="flex gap-0.5 sm:gap-1">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className="font-body text-[12px] sm:text-[13px] text-paper/70 px-2 sm:px-2.5 py-2 rounded-md whitespace-nowrap hover:text-gold hover:bg-gold/[0.08] transition-colors"
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

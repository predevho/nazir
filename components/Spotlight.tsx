import { useEffect, useRef } from 'react';

export function useSpotlight() {
  const spot = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!spot.current || !beam.current) return;
      const r = spot.current.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      if (x < -10 || x > 110) return;
      beam.current.style.background = `radial-gradient(420px circle at ${x}% ${y}%, rgba(233,185,73,.24), rgba(233,185,73,.07) 42%, transparent 70%)`;
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);
  return { spot, beam };
}

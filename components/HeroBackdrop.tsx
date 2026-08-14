'use client';
import { useSpotlight } from './Spotlight';

export function HeroBackdrop({ verse, meta }: { verse: string; meta: string }) {
  const { spot, beam } = useSpotlight();
  return (
    <div ref={spot} className="relative min-h-[min(88vh,760px)] flex flex-col justify-center items-center text-center px-5 py-[clamp(56px,10vw,120px)] overflow-hidden bg-stage">
      <div ref={beam} className="absolute -inset-[20%] pointer-events-none animate-glow" style={{ background: 'radial-gradient(420px circle at 50% 42%, rgba(233,185,73,.22), rgba(233,185,73,.06) 42%, transparent 70%)' }} />
      <p className="relative font-display text-[clamp(14px,3.4vw,18px)] leading-[2] text-paper/[0.66] max-w-[640px] mb-[clamp(32px,7vw,56px)]">{verse}</p>
      <p className="relative font-display text-[clamp(16px,4vw,28px)] tracking-[0.28em] text-paper/75 mb-[clamp(6px,1.6vw,12px)]">창작 뮤지컬</p>
      <h1 className="relative font-display font-bold text-[clamp(76px,22vw,200px)] leading-[0.92] tracking-[0.02em] m-0 text-paper" style={{ textShadow: '0 0 60px rgba(233,185,73,.28)' }}>나지르</h1>
      <p className="relative font-display text-[clamp(18px,5vw,32px)] tracking-[0.34em] mt-[clamp(14px,3vw,22px)] text-gold">구별된 사람들</p>
      <p className="relative font-mono text-[clamp(10px,2.6vw,12px)] tracking-[0.12em] text-paper/50 mt-[clamp(28px,6vw,44px)] leading-[2] whitespace-pre-line">{meta}</p>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { useSpotlight } from '../components/Spotlight';
import { useContent } from '../lib/useContent';

const cards = [
  { to: '/about', n: '01', title: '<나지르>에 대하여', desc: '연출의 인사말 · 작품 소개' },
  { to: '/process', n: '02', title: '<나지르>가 무대에 오르기까지', desc: '제작 일정 · 함께하는 사람들 · 예산' },
  { to: '/join', n: '03', title: '<나지르>와 함께하기', desc: '후원 안내 · 기도 제목 · Q&A' },
];

export default function Home() {
  const { spot, beam } = useSpotlight();
  const state = useContent();
  const site = state.status === 'ready' ? state.data.site : undefined;
  return (
    <section>
      <div ref={spot} className="relative min-h-[min(88vh,760px)] flex flex-col justify-center items-center text-center px-5 py-[clamp(56px,10vw,120px)] overflow-hidden bg-stage">
        <div ref={beam} className="absolute -inset-[20%] pointer-events-none animate-glow" style={{ background: 'radial-gradient(420px circle at 50% 42%, rgba(233,185,73,.22), rgba(233,185,73,.06) 42%, transparent 70%)' }} />
        <p className="relative font-display text-[clamp(14px,3.4vw,18px)] leading-[2] text-paper/[0.66] max-w-[640px] mb-[clamp(32px,7vw,56px)]">{site?.heroVerse}</p>
        <h1 className="relative font-display font-bold text-[clamp(76px,22vw,200px)] leading-[0.92] tracking-[0.02em] m-0 text-paper" style={{ textShadow: '0 0 60px rgba(233,185,73,.28)' }}>나지르</h1>
        <p className="relative font-display text-[clamp(18px,5vw,32px)] tracking-[0.34em] mt-[clamp(14px,3vw,22px)] text-gold">구별된 사람들</p>
        <p className="relative font-mono text-[clamp(10px,2.6vw,12px)] tracking-[0.12em] text-paper/50 mt-[clamp(28px,6vw,44px)] leading-[2] whitespace-pre-line">{site?.heroMeta}</p>
      </div>
      <div className="max-w-[1180px] mx-auto px-5 pt-[clamp(40px,8vw,80px)] pb-[clamp(90px,14vw,120px)] grid grid-cols-1 sm:grid-cols-3 gap-[clamp(8px,2vw,16px)]">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="text-left bg-velvet border border-gold/20 rounded-sm p-[clamp(24px,5vw,32px)] flex flex-col gap-3.5 text-paper hover:border-gold/55 hover:bg-velvet-2 transition-colors">
            <span className="font-mono text-[11px] tracking-[0.2em] text-gold">{c.n}</span>
            <span className="font-display text-[clamp(20px,4.6vw,25px)] leading-[1.4] min-h-[2.8em]">{c.title}</span>
            <span className="text-[13px] font-light text-paper/[0.62] leading-[1.8]">{c.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

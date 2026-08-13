import Link from 'next/link';
import { HeroBackdrop } from '@/components/HeroBackdrop';
import { getContent } from '@/lib/content';

const cards = [
  { to: '/about', n: '01', title: '<나지르>에 대하여', desc: '연출의 인사말 · 작품 소개' },
  { to: '/process', n: '02', title: '<나지르>가 무대에 오르기까지', desc: '제작 일정 · 함께하는 사람들 · 예산' },
  { to: '/join', n: '03', title: '<나지르>와 함께하기', desc: '후원 안내 · 기도 제목 · Q&A' },
];

export default async function Home() {
  const { site } = await getContent();
  return (
    <section>
      <HeroBackdrop verse={site.heroVerse} meta={site.heroMeta} />
      <div className="max-w-[1180px] mx-auto px-5 pt-[clamp(40px,8vw,80px)] pb-[clamp(90px,14vw,120px)] grid grid-cols-1 sm:grid-cols-3 gap-[clamp(8px,2vw,16px)]">
        {cards.map((c) => (
          <Link key={c.to} href={c.to} className="text-left bg-velvet border border-gold/20 rounded-sm p-[clamp(24px,5vw,32px)] flex flex-col gap-3.5 text-paper hover:border-gold/55 hover:bg-velvet-2 transition-colors">
            <span className="font-mono text-[11px] tracking-[0.2em] text-gold">{c.n}</span>
            <span className="font-display text-[clamp(20px,4.6vw,25px)] leading-[1.4] min-h-[2.8em]">{c.title}</span>
            <span className="text-[13px] font-light text-paper/[0.62] leading-[1.8]">{c.desc}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

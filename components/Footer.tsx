import type { SiteContent } from '../content/types';

export function Footer({ site }: { site?: SiteContent }) {
  return (
    <footer className="bg-velvet border-t border-gold/15 px-5 py-[clamp(40px,8vw,64px)]">
      <div className="max-w-[1180px] mx-auto grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
        <div className="flex flex-col gap-2.5">
          <span className="font-display text-[26px] text-gold">나지르</span>
          <span className="font-display text-[15px] tracking-[0.2em] text-paper/70">구별된 사람들</span>
          <span className="font-mono text-[10px] tracking-[0.14em] text-paper/45 leading-loose">2027 창작뮤지컬 · 제작 PRAYSOUND</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">CONTACT</span>
          <a href={site?.contactInstagram ?? '#'} target="_blank" rel="noopener" className="text-[13.5px] font-light">문의 — musical_naz(Instagram DM)</a>
        </div>
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">FOLLOW</span>
          <a href={site?.instagramMain ?? '#'} target="_blank" rel="noopener" className="text-[13.5px] font-light">Instagram — Pray Sound</a>
          <a href={site?.instagramMusical ?? '#'} target="_blank" rel="noopener" className="text-[13.5px] font-light">Instagram — 뮤지컬 나지르</a>
          <a href={site?.youtube ?? '#'} target="_blank" rel="noopener" className="text-[13.5px] font-light">YouTube — Pray Sound</a>
        </div>
      </div>
      <p className="max-w-[1180px] mx-auto mt-[clamp(36px,7vw,56px)] pt-5 border-t border-gold/10 font-display text-[13px] text-paper/50">사람이 마음으로 자기의 길을 계획할지라도 — 잠 16:9</p>
    </footer>
  );
}

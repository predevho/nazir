import { getContent } from '@/lib/content';

export default async function About() {
  const { site, characters } = await getContent();
  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(48px,9vw,88px)] pb-[clamp(100px,14vw,140px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">01 / ABOUT</p>
      <h2 className="font-display font-bold text-[clamp(30px,7.5vw,46px)] leading-[1.35] text-paper mb-[clamp(40px,8vw,64px)]">&lt;나지르&gt;에 대하여</h2>

      <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))] items-start mb-[clamp(56px,9vw,80px)]">
        <div className="aspect-[3/4] border border-gold/25 bg-[repeating-linear-gradient(135deg,#17131F,#17131F_8px,#1C1726_8px,#1C1726_16px)] flex items-center justify-center text-center p-4">
          <span className="font-mono text-[11px] leading-[1.9] text-paper/50">연출자 사진<br />3:4 · 세로</span>
        </div>
        <div>
          <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-gold mb-[18px]">연출의 인사말</h3>
          <p className="text-sm font-light leading-[2.1] text-paper/50 mb-7 whitespace-pre-line">{site.aboutGreeting}</p>
          <div className="border-t border-gold/20 pt-[18px] flex flex-col gap-1">
            <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">DIRECTOR</span>
            <span className="font-display text-[22px] text-paper">정은수</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)] mb-[clamp(56px,9vw,80px)]">
        <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-gold mb-[22px]">Praysound의 이야기</h3>
        <p className="font-display text-[clamp(17px,4.2vw,21px)] leading-[1.95] text-paper mb-6">{site.praysoundStory1}</p>
        <p className="text-sm font-light leading-[2.1] text-paper/[0.72]">{site.praysoundStory2}</p>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)] mb-[clamp(56px,9vw,80px)]">
        <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-gold mb-6">작품 개요</h3>
        <dl className="m-0 grid gap-px bg-gold/[0.14] border border-gold/[0.14]">
          {site.facts.map((f) => (
            <div key={f.key} className="bg-velvet px-[18px] py-4 flex gap-4 items-baseline">
              <dt className="font-mono text-[11px] tracking-[0.12em] text-paper/50 min-w-[84px]">{f.key}</dt>
              <dd className="m-0 text-sm font-light text-paper">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)] mb-[clamp(56px,9vw,80px)] grid gap-9">
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold mb-4">LOGLINE</h3>
          <p className="font-display text-[clamp(19px,5vw,27px)] leading-[1.8] text-paper">{site.logline}</p>
        </div>
        <div>
          <h3 className="font-mono text-[11px] tracking-[0.2em] text-gold mb-4">SYNOPSIS</h3>
          <p className="text-sm font-light leading-[2.15] text-paper/[0.78]">{site.synopsis}</p>
        </div>
      </div>

      <div className="border-t border-gold/15 pt-[clamp(40px,7vw,56px)]">
        <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-gold mb-6">주요 등장인물</h3>
        <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {characters.map((c) => (
            <article key={c.id} className="bg-velvet border border-gold/[0.14] p-5 flex flex-col gap-3">
              <div className="aspect-square bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
                <span className="font-mono text-[10px] text-paper/40">배우 사진 1:1</span>
              </div>
              <h4 className="font-display text-2xl text-gold m-0">{c.name}</h4>
              <p className="text-[13px] font-light leading-[1.95] text-paper/[0.72] m-0">{c.description}</p>
            </article>
          ))}
        </div>
        <p className="text-[13px] font-light text-paper/55 mt-6 pl-4 border-l-2 border-gold/40">이 외에도 7명의 조연과 9명의 앙상블이 함께 &lt;나지르&gt;를 채워갑니다.</p>
      </div>
    </section>
  );
}

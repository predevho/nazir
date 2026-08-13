import { Accordion } from '@/components/Accordion';
import { StatusChip } from '@/components/StatusChip';
import { getContent } from '@/lib/content';

export default async function Process() {
  const { site, timeline, people, budget } = await getContent();
  return (
    <section className="max-w-[900px] mx-auto px-5 py-[clamp(48px,9vw,88px)] pb-[clamp(100px,14vw,140px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">02 / PROCESS</p>
      <h2 className="font-display font-bold text-[clamp(30px,7.5vw,46px)] leading-[1.35] text-paper mb-4">무대에 오르기까지</h2>
      <p className="text-sm font-light leading-[2] text-paper/[0.72] mb-[clamp(40px,8vw,64px)] max-w-[56ch]">{site.processIntro}</p>

      <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-paper mb-4">제작 일정</h3>
      <ol className="list-none m-0 mb-[clamp(48px,8vw,72px)] p-0 grid gap-px bg-gold/[0.14] border border-gold/[0.14]">
        {timeline.map((t) => (
          <li key={t.id} className="bg-velvet px-[18px] py-4 flex flex-wrap gap-x-4 gap-y-2 items-center">
            <span className="font-mono text-[11px] tracking-[0.08em] text-paper/50 min-w-[150px]">{t.period}</span>
            <span className="text-sm text-paper flex-1 min-w-[140px]">{t.title}</span>
            <StatusChip status={t.status} />
          </li>
        ))}
      </ol>

      <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-paper mb-3">함께 세우는 사람들</h3>
      <p className="text-sm font-light leading-[2] text-paper/[0.72] mb-5">{site.peopleIntro}</p>
      <div className="grid gap-px bg-gold/[0.14] border border-gold/[0.14] mb-[clamp(48px,8vw,72px)]">
        {people.map((g) => (
          <Accordion key={g.id} label={g.label} defaultOpen={g.label === '헤더진'}>
            {g.members.map((m) => (
              <p key={m.id} className="m-0 text-[13.5px] font-light leading-[1.95] text-paper/[0.78]">{m.text}</p>
            ))}
          </Accordion>
        ))}
      </div>

      <h3 className="font-display text-[clamp(20px,4.6vw,26px)] text-paper mb-2">제작 예산</h3>
      <p className="font-mono text-[clamp(24px,7vw,38px)] text-gold mb-5">{site.budgetTotal}</p>
      <ul className="list-none m-0 mb-[18px] p-0 grid gap-px [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))] bg-gold/[0.14] border border-gold/[0.14]">
        {budget.map((b) => (
          <li key={b.id} className="bg-velvet px-4 py-[15px] flex justify-between gap-2.5 items-baseline">
            <span className="text-[13.5px] text-paper">{b.name}</span>
            <span className="font-mono text-[11px] text-paper/45">미공개</span>
          </li>
        ))}
      </ul>
      <p className="text-[13px] font-light leading-[1.9] text-paper/70 pl-3.5 border-l-2 border-gold">{site.budgetNote}</p>
    </section>
  );
}

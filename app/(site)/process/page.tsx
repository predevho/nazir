import { Accordion } from '@/components/Accordion';
import { StatusChip } from '@/components/StatusChip';
import { MarkdownText } from '@/components/MarkdownText';
import Link from 'next/link';
import { getContent } from '@/lib/content';
import { groupMembersByTeam } from '@/lib/people';

export const revalidate = 60;

export default async function Process() {
  const { site, timeline, people, budget } = await getContent();
  return (
    <section className="max-w-[900px] mx-auto px-5 py-[clamp(48px,9vw,88px)] pb-[clamp(100px,14vw,140px)]">
      <p className="font-mono text-[11px] tracking-[0.2em] text-gold mb-3">02 / IN THE MAKING</p>
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
            <div className="flex flex-col gap-4">
              {groupMembersByTeam(g.members).map((bucket) => (
                <div key={bucket.team || '_'} className="flex flex-col gap-2">
                  {bucket.team && (
                    <span className="font-mono text-[11px] tracking-[0.14em] text-gold/80 border-l-2 border-gold/40 pl-2">{bucket.team}</span>
                  )}
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {bucket.members.map((m) => (
                      <div key={m.id} className="flex flex-col gap-1.5">
                        <Link href={`/people/${m.id}`} className="flex flex-col gap-1.5 group">
                          <div className="aspect-square rounded-sm overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
                            {m.photoUrl ? (
                              <img src={m.photoUrl} alt={m.name} loading="lazy" className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                            ) : (
                              <span className="font-mono text-[10px] text-paper/40">사진</span>
                            )}
                          </div>
                          {m.role && <span className="font-mono text-[10px] tracking-[0.06em] text-gold">{m.role}</span>}
                          <span className="font-display text-sm text-paper leading-tight group-hover:text-gold transition-colors">{m.name}</span>
                        </Link>
                        <MarkdownText className="text-[12px] font-light text-paper/70">{m.bio}</MarkdownText>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

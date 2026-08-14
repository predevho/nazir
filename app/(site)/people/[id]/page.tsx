import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { findPersonById } from '@/lib/people';
import { MarkdownText } from '@/components/MarkdownText';

export async function generateStaticParams() {
  const { people } = await getContent();
  return people.flatMap((g) => g.members.map((m) => ({ id: m.id })));
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const content = await getContent();
  const found = findPersonById(content, id);
  if (!found) notFound();
  const { member, groupLabel } = found;
  const meta = [groupLabel, member.team, member.role].filter(Boolean).join(' · ');

  return (
    <section className="max-w-[820px] mx-auto px-5 py-[clamp(32px,7vw,64px)]">
      <Link href="/process" className="font-mono text-[11px] text-gold hover:text-gold-soft">← 함께 세우는 사람들</Link>
      <div className="mt-6 grid gap-6 sm:[grid-template-columns:280px_1fr] items-start">
        <div className="aspect-square rounded-sm overflow-hidden bg-[repeating-linear-gradient(135deg,#0B0A0E,#0B0A0E_8px,#141019_8px,#141019_16px)] flex items-center justify-center">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono text-[11px] text-paper/40">사진</span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {meta && <span className="font-mono text-[11px] tracking-[0.12em] text-gold">{meta}</span>}
          <h1 className="font-display font-bold text-[clamp(28px,6vw,44px)] text-paper leading-tight m-0">{member.name}</h1>
          {member.tagline && <p className="font-display text-[15px] text-paper/70 leading-relaxed">{member.tagline}</p>}
          {member.bio && (
            <div className="mt-2 pt-4 border-t border-gold/15">
              <span className="font-mono text-[10px] tracking-[0.18em] text-paper/45">약력</span>
              <MarkdownText className="mt-2 text-[14px] font-light leading-[1.9] text-paper/[0.82]">{member.bio}</MarkdownText>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

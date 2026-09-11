import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { SectionDots } from '@/components/section/SectionDots';
import { SwipeNavigator } from '@/components/section/SwipeNavigator';
import { SectionEdgeNav } from '@/components/section/SectionEdgeNav';
import { getNeighbors } from '@/lib/sectionNav';
import { TimelineCard } from '@/components/process/TimelineCard';
import { BudgetCard } from '@/components/process/BudgetCard';
import { PROCESS_SECTIONS, findProcessSection } from '@/content/process';
import { pageMeta } from '@/lib/pageMeta';

export const revalidate = 60;

export function generateStaticParams() {
  return PROCESS_SECTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const section = findProcessSection(slug);
  if (!section) return {};
  return { title: section.title, ...pageMeta(`/process/${section.slug}`) };
}

/**
 * 시안 `제작 과정` 2개 프레임.
 * 좌측 제목 블록(폭 497) + 우측 카드(838 폭) + 하단 도트 2개.
 *
 * 01은 일정을 완료 / 진행 중·예정으로 갈라 카드 2장으로 보여준다(명세 23행).
 * 02는 총액만 공개하고 항목은 이름만 2열로 나열한다(코멘트 #31 — 항목별 금액 비공개).
 */
export default async function ProcessSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = findProcessSection(slug);
  if (!section) notFound();
  const { site, timeline, budget } = await getContent();

  const past = timeline.filter((t) => t.status === '완료');
  const ahead = timeline.filter((t) => t.status !== '완료');
  const intro = section.slug === 'schedule' ? site.processIntro : site.budgetNote;

  const neighbors = getNeighbors(PROCESS_SECTIONS, section.slug, '/process');

  return (
    <SwipeNavigator neighbors={neighbors}>
      <SectionEdgeNav neighbors={neighbors} />
      <section className="mx-auto max-w-content px-6 xl:px-8 py-[clamp(48px,7vw,88px)]">
        <div className="grid gap-x-16 gap-y-12 xl:grid-cols-[497px_1fr]">
          <header className="flex flex-col gap-3">
            <p className="font-heir text-[20px] leading-none text-ds-text/70">{section.no}</p>
            <h1 className="font-heir text-[clamp(30px,4vw,45px)] leading-[1.4] tracking-[-0.025em] text-ds-text">
              {section.title}
            </h1>
            <MarkdownText className="mt-4 max-w-[586px] font-desc font-extralight text-[15px] leading-[2] text-ds-text/70">
              {intro}
            </MarkdownText>
          </header>

          <div className="min-w-0">
            {section.slug === 'schedule' && (
              <div className="flex flex-col gap-6">
                <TimelineCard title="지나온 이야기" note="완료된 일정" events={past} tone="past" />
                <TimelineCard
                  title="앞으로 걸어갈 이야기"
                  note="진행 중인 일정"
                  events={ahead}
                  tone="ahead"
                />
              </div>
            )}

            {section.slug === 'budget' && <BudgetCard total={site.budgetTotal} items={budget} />}
          </div>
        </div>

        <div className="mt-[clamp(48px,7vw,88px)]">
          <SectionDots
            items={PROCESS_SECTIONS}
            activeSlug={section.slug}
            basePath="/process"
            label="제작 과정"
          />
        </div>
      </section>
    </SwipeNavigator>
  );
}

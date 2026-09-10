import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { MarkdownText } from '@/components/MarkdownText';
import { SectionDots } from '@/components/SectionDots';
import { SwipeNavigator } from '@/components/SwipeNavigator';
import { getNeighbors } from '@/lib/sectionNav';
import { TimelineCard } from '@/components/TimelineCard';
import { PROCESS_SECTIONS, findProcessSection } from '@/content/process';

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
  return { title: section.title };
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
      <section className="mx-auto max-w-content px-6 xl:px-8 py-[clamp(48px,7vw,88px)]">
        <div className="grid gap-x-16 gap-y-12 xl:grid-cols-[497px_1fr]">
          <header className="flex flex-col gap-3">
            <p className="font-heir text-[20px] leading-none text-ds-text/70">{section.no}</p>
            <h1 className="font-heir text-[clamp(30px,4vw,45px)] leading-[1.4] tracking-[-0.025em] text-ds-text">
              {section.title}
            </h1>
            <MarkdownText className="mt-4 max-w-[586px] font-heir text-[15px] leading-[2] text-ds-text/70">
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

            {section.slug === 'budget' && (
              <div className="rounded-lg border-[0.5px] border-ds-key2/40 p-[clamp(24px,4vw,44px)]">
                <p className="font-heir text-[clamp(20px,2.6vw,26px)] leading-none text-ds-key2">
                  총 제작 예산 : {site.budgetTotal}
                </p>
                <hr className="mt-7 border-0 border-t-[0.5px] border-ds-key2" />
                {/*
                  항목만 나열한다. 항목별 금액은 공개하지 않기로 확정된 사항이다(코멘트 #31).
                  시안은 2열 사이에 세로 구분선, 행 사이에 가로 구분선을 둔다.
                */}
                <ul className="m-0 grid list-none grid-cols-1 p-0 sm:grid-cols-2">
                  {budget.map((b, i) => (
                    <li
                      key={b.id}
                      className={`border-ds-key2/40 py-6 text-center font-heir text-[16px] text-ds-text ${
                        i % 2 === 0 ? 'sm:border-r-[0.5px]' : ''
                      } ${i >= 2 ? 'border-t-[0.5px]' : ''}`}
                    >
                      {b.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

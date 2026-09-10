import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { CopyButton } from '@/components/CopyButton';
import { SectionDots } from '@/components/SectionDots';
import { SwipeNavigator } from '@/components/SwipeNavigator';
import { getNeighbors } from '@/lib/sectionNav';
import { MarkdownText } from '@/components/MarkdownText';
import { JOIN_SECTIONS, findJoinSection } from '@/content/join';

export const revalidate = 60;

export function generateStaticParams() {
  return JOIN_SECTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const section = findJoinSection(slug);
  if (!section) return {};
  return { title: `${section.title} · 후원과 기도` };
}

/**
 * 시안 `후원과 기도` 2개 프레임.
 * 좌측 제목 블록(폭 497) + 우측 카드(838 폭, 반경 8px, 배경 #181A1B) + 하단 도트 2개.
 *
 * 시안 좌측 본문은 01·02가 같은 문구로 복붙돼 있다(미작성). 랜딩 카드와 같은 사정이라
 * 01은 시안 문구를 그대로 쓰고 02는 기존 기도 안내 문구를 쓴다.
 */
export default async function JoinSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = findJoinSection(slug);
  if (!section) notFound();
  const { site, prayers } = await getContent();
  const intro = section.slug === 'support' ? site.joinIntro : site.prayerIntro;

  const neighbors = getNeighbors(JOIN_SECTIONS, section.slug, '/join');

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
            <blockquote className="mt-8 m-0 border-0">
              <p className="whitespace-pre-line font-heir text-[15px] leading-[2] text-ds-text/70">
                {site.joinVerse}
              </p>
              <cite className="mt-1 block font-heir text-[15px] not-italic text-ds-text/50">
                {site.joinVerseRef}
              </cite>
            </blockquote>
          </header>

          <div className="min-w-0">
            {section.slug === 'support' && (
              <div className="rounded-lg border-[0.5px] border-ds-key2/30 bg-gradient-to-b from-ds-panel to-ds-bg p-[clamp(24px,4vw,44px)]">
                <h2 className="font-heir text-[26px] leading-none text-ds-key2">후원 안내</h2>
                <MarkdownText className="mt-6 font-heir text-[15px] leading-[2] text-ds-text/80">
                  {site.supportIntro}
                </MarkdownText>
                <a
                  href={site.supportFormUrl}
                  target="_blank"
                  rel="noopener"
                  className="mt-7 flex min-h-[48px] items-center justify-center rounded-sm bg-ds-key2 font-heir text-[16px] text-ds-key1 transition-opacity hover:opacity-85"
                >
                  후원 신청서 작성하기
                </a>

                <div className="mt-7 rounded-sm border border-dashed border-ds-key2/40 p-6">
                  <p className="font-heir text-[13px] leading-none text-ds-text/60">{site.accountBank}</p>
                  <p className="mt-3 font-heir text-[clamp(22px,3vw,30px)] leading-none text-ds-text">
                    {site.accountNumber}
                  </p>
                  <p className="mt-3 font-heir text-[13px] leading-none text-ds-text/60">
                    {site.accountHolder}
                  </p>
                  <CopyButton
                    value={site.accountNumber}
                    idleLabel="계좌번호 복사"
                    doneLabel="계좌번호가 복사되었습니다"
                    className="mt-6 flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-sm bg-ds-key2/60 font-heir text-[15px] text-ds-key1 transition-opacity hover:opacity-85"
                  />
                </div>
              </div>
            )}

            {section.slug === 'prayer' && (
              <div className="rounded-lg border-[0.5px] border-ds-key2/30 bg-gradient-to-b from-ds-panel to-ds-bg p-[clamp(24px,4vw,44px)]">
                <h2 className="font-heir text-[26px] leading-none text-ds-key2">기도 제목</h2>
                <p className="mt-5 font-heir text-[15px] leading-[2] text-ds-text/70">{site.prayerNote}</p>
                <ol className="m-0 mt-8 grid list-none gap-6 p-0">
                  {prayers.map((p, i) => (
                    <li key={p.id} className="flex gap-4">
                      <span className="flex-none font-heir text-[16px] leading-[1.9] text-ds-key2">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-heir text-[16px] leading-[1.9] text-ds-text">{p.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="mt-[clamp(48px,7vw,88px)]">
          <SectionDots
            items={JOIN_SECTIONS}
            activeSlug={section.slug}
            basePath="/join"
            label="후원과 기도"
          />
        </div>
      </section>
    </SwipeNavigator>
  );
}

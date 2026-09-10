import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { SectionDots } from '@/components/section/SectionDots';
import { SwipeNavigator } from '@/components/section/SwipeNavigator';
import { SectionEdgeNav } from '@/components/section/SectionEdgeNav';
import { getNeighbors } from '@/lib/sectionNav';
import { LetterCarousel } from '@/components/about/LetterCarousel';
import {
  ABOUT_SECTIONS,
  findAboutSection,
  hasLetterCarousel,
  letterAspect,
  type AboutSection,
} from '@/content/about';
import type { AllContent } from '@/content/types';
import { pageMeta } from '@/lib/pageMeta';

export const revalidate = 60;

export function generateStaticParams() {
  return ABOUT_SECTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const section = findAboutSection(slug);
  if (!section) return {};
  return {
    title: `${section.title} · 〈나지르〉에 대하여`,
    ...pageMeta(`/about/${section.slug}`),
  };
}

/**
 * 좌측 컬럼 본문. 시안은 4개 다 `간단한 설명 간단한 설명…` 더미라(코멘트 #42)
 * 실제 문구가 있는 01·02만 채운다.
 *
 * 03·04는 비워둔다. 로그라인·시놉시스·인물 설명이 이미 우측에 있어서 아무거나 끌어다
 * 넣으면 같은 문장이 한 화면에 두 번 나온다. 확정 문구가 오면 여기에 채우면 된다.
 */
function intro(section: AboutSection, content: AllContent): string {
  switch (section.slug) {
    case 'greeting':
      return content.site.aboutGreeting;
    case 'praysound':
      return `${content.site.praysoundStory1}\n\n${content.site.praysoundStory2}`;
    default:
      return '';
  }
}

/**
 * 시안 `<나지르>에 대하여` 4개 프레임.
 * 좌측 제목 블록(폭 497, 제목 45px) + 우측 콘텐츠 + 하단 도트 4개 구조가 4개 공통이다.
 */
export default async function AboutSectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = findAboutSection(slug);
  if (!section) notFound();
  const content = await getContent();
  const { site, characters } = content;

  const neighbors = getNeighbors(ABOUT_SECTIONS, section.slug, '/about');

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
            <MarkdownText className="mt-4 max-w-[586px] font-heir text-[15px] leading-[2] text-ds-text/70">
              {intro(section, content)}
            </MarkdownText>
          </header>

          <div className="min-w-0">
            {hasLetterCarousel(section.slug) && (
              <div className="mx-auto max-w-[634px]">
                <LetterCarousel
                  letters={content.letters.filter((l) => l.section === section.slug)}
                  label={section.title}
                  aspect={letterAspect(section.slug)}
                />
              </div>
            )}

            {section.slug === 'work' && (
              <div className="flex flex-col gap-12">
                <div className="border border-ds-key2/40 p-8">
                  <h2 className="font-heir text-[26px] leading-none text-ds-key2">작품 개요</h2>
                  <dl className="mt-6 m-0 grid gap-3">
                    {site.facts.map((f) => (
                      <div key={f.key} className="flex gap-6">
                        <dt className="min-w-[140px] font-heir text-[15px] text-ds-key2">{f.key}</dt>
                        <dd className="m-0 font-heir text-[15px] text-ds-text">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <h2 className="font-heir text-[26px] leading-none text-ds-key2">로그라인</h2>
                  <p className="mt-4 max-w-[483px] font-heir text-[20px] leading-[1.78] text-white">
                    {site.logline}
                  </p>
                </div>
                <div>
                  <h2 className="font-heir text-[26px] leading-none text-ds-key2">시놉시스</h2>
                  <p className="mt-4 max-w-[483px] font-heir text-[20px] leading-[1.78] text-white">
                    {site.synopsis}
                  </p>
                </div>
              </div>
            )}

            {/*
              시안 인물 카드는 이름 + 설명만 있고 사진이 없다. 반면 요구사항 명세서 21행은
              "이미지 카드 형태"를 요구한다. 사진이 등록된 인물만 사진을 얹어 둘 다 만족시킨다
              — 지금은 전원 미등록이라 화면은 시안과 같고, 관리자가 올리면 카드에 나타난다.
            */}
            {section.slug === 'characters' && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {characters.map((c) => (
                  <li key={c.id} className="flex gap-5 border border-ds-key2/40 p-6">
                    {c.photoUrl && (
                      <img
                        src={c.photoUrl}
                        alt={c.name}
                        loading="lazy"
                        className="h-24 w-24 flex-none rounded-sm object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <h2 className="font-heir text-[22px] leading-none text-ds-key2">{c.name}</h2>
                      <MarkdownText className="mt-3 font-heir text-[15px] leading-[1.9] text-ds-text/80">
                        {c.description}
                      </MarkdownText>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-[clamp(48px,7vw,88px)]">
          <SectionDots
            items={ABOUT_SECTIONS}
            activeSlug={section.slug}
            basePath="/about"
            label="〈나지르〉에 대하여"
          />
        </div>
      </section>
    </SwipeNavigator>
  );
}

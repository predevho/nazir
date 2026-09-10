import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { findPersonById } from '@/lib/people';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { Chevron } from '@/components/ui/Chevron';
import { pageMeta } from '@/lib/pageMeta';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = findPersonById(await getContent(), id);
  if (!found) return {};
  const { member, groupLabel } = found;
  return {
    title: `${member.name} · 함께하는 사람들`,
    description: [groupLabel, member.team, member.role, member.name]
      .filter(Boolean)
      .join(' · '),
    ...pageMeta(`/people/${member.id}`),
  };
}

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
    /*
     * 이 화면만 새 시안 작업에서 빠져 옛 규칙(max-w-[820px]·font-mono·11px 라벨)이
     * 남아 있었다. 시안이 없는 화면이라 새로 그리는 대신 다른 페이지의 규칙을 따른다
     * — 콘텐츠 폭 1398, 여백 24/32, 본문 15px, 제목 블록과 내용을 좌우로 나눈 격자.
     *
     * 담는 내용(사진·소속·이름·한 줄 소개·약력)은 그대로다. Figma 코멘트 #37 답변으로
     * 정해진 구성이고, 요구사항 명세 32~34행에는 상세페이지 항목 자체가 없어
     * 임의로 늘리거나 줄일 근거가 없다.
     */
    <section className="mx-auto max-w-content px-6 xl:px-8 py-[clamp(48px,7vw,88px)]">
      <Link
        href={`/people?tab=${encodeURIComponent(groupLabel)}`}
        className="tap-target inline-flex items-center gap-2 font-heir text-[15px] text-ds-key2 transition-opacity hover:opacity-80"
      >
        <Chevron dir="left" />
        함께하는 사람들
      </Link>

      {/*
        폭을 1398 끝까지 늘리지 않는다. 지금 43명 전원이 사진·한 줄 소개·약력 없이
        이름만 있어서, 넓게 펼치면 오른쪽이 통째로 비어 보인다. 사진 320 + 본문 586(다른
        페이지와 같은 읽기 폭)으로 묶어 두면 내용이 채워질수록 자연스럽게 길어진다.
      */}
      <div className="mt-[clamp(28px,4vw,48px)] grid items-start gap-x-16 gap-y-10 xl:grid-cols-[320px_minmax(0,586px)]">
        {/* 목록 카드와 같은 비율·모서리. 노란 채움은 카드에서 이름표까지 있을 때의 조형이라
            여기서는 어두운 패널에 키컬러 테두리로 둔다 — 편지 자리와 같은 규칙이다.

            폭을 320 으로 묶는다. xl 미만은 한 줄로 쌓이는데 그대로 두면 768 에서
            720×933 짜리 빈 상자가 된다 — 27:35 비율이 높이를 그만큼 밀어 올린다. */}
        <div className="flex aspect-[27/35] w-full max-w-[320px] items-center justify-center overflow-hidden rounded-lg border-[0.5px] border-ds-key2/40 bg-ds-panel">
          {member.photoUrl ? (
            <img
              src={member.photoUrl}
              alt={member.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-heir text-[15px] text-ds-text/40">사진</span>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {meta && <p className="font-heir text-[20px] leading-none text-ds-text/70">{meta}</p>}
          <h1 className="font-heir text-[clamp(30px,4vw,45px)] leading-[1.4] tracking-[-0.025em] text-ds-text">
            {member.name}
          </h1>
          {member.tagline && (
            <p className="max-w-[586px] font-heir text-[15px] leading-[2] text-ds-text/70">
              {member.tagline}
            </p>
          )}
          {member.bio && (
            <div className="mt-4 border-t-[0.5px] border-ds-key2/40 pt-6">
              <h2 className="font-heir text-[16px] leading-none text-ds-key2">약력</h2>
              <MarkdownText className="mt-4 max-w-[586px] font-heir text-[15px] leading-[2] text-ds-text/70">
                {member.bio}
              </MarkdownText>
            </div>
          )}

          {/* 소개가 하나도 없으면 이름만 덩그러니 남는다. 편지 자리와 같은 방식으로
              "비어 있다"가 아니라 "아직 준비 중"임을 밝힌다. */}
          {!member.tagline && !member.bio && (
            <p className="mt-4 border-t-[0.5px] border-ds-key2/40 pt-6 font-heir text-[15px] leading-[2] text-ds-text/40">
              소개가 아직 준비되지 않았습니다.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

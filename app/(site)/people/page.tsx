import type { Metadata } from 'next';
import { getContent } from '@/lib/content';
import { resolvePeopleTab } from '@/lib/people';
import { PeopleTabs } from '@/components/people/PeopleTabs';
import { PeopleGrid } from '@/components/people/PeopleGrid';
import { MarkdownText } from '@/components/ui/MarkdownText';
import { pageMeta } from '@/lib/pageMeta';

export const revalidate = 60;

export const metadata: Metadata = {
  title: '함께하는 사람들',
  description: '창작뮤지컬 <나지르>를 함께 세워가는 헤더진 · 스탭진 · 배우를 소개합니다.',
  ...pageMeta('/people'),
};

/**
 * 시안 `함께하는 사람들` 3개 프레임(헤더진 / 스탭진 / 배우)을 한 라우트 + `?tab=`으로 다룬다.
 * 제목 중앙 정렬 → 탭 → 그리드 순서는 시안 그대로다.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const { site, people } = await getContent();
  const active = resolvePeopleTab(people, tab);

  return (
    <section className="mx-auto max-w-content px-6 xl:px-8 py-[clamp(48px,9vw,120px)]">
      <h1 className="text-center font-heir text-[clamp(30px,5vw,44px)] leading-none text-ds-text">
        함께하는 사람들
      </h1>

      {/*
        제목 아래 한 줄 설명(명세 6행). 관리자의 `함께 세우는 사람들 안내` 칸이 여기로 온다 —
        그 칸은 있는데 그리는 곳이 없어서, 운영진이 문구를 고쳐도 아무 데도 안 나왔다.
      */}
      {site.peopleIntro && (
        <MarkdownText className="mx-auto mt-4 max-w-[720px] text-center font-heir text-[15px] leading-[2] text-ds-text/70">
          {site.peopleIntro}
        </MarkdownText>
      )}

      {active && (
        <>
          <div className="mt-[clamp(32px,5vw,56px)]">
            <PeopleTabs groups={people} activeLabel={active.label} />
          </div>
          <div className="mt-[clamp(32px,5vw,56px)]">
            <PeopleGrid members={active.members} />
          </div>
        </>
      )}
    </section>
  );
}

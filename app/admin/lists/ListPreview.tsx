'use client';
import { Component, type ReactNode } from 'react';
import type { ListConfig } from '@/lib/adminLists';
import type {
  AboutLetter,
  AboutLetterSection,
  BudgetItem,
  Character,
  Fact,
  Prayer,
  TimelineEvent,
  TimelineStatus,
} from '@/content/types';
import { TimelineCard } from '@/components/process/TimelineCard';
import { BudgetCard } from '@/components/process/BudgetCard';
import { FactsCard } from '@/components/about/FactsCard';
import { CharacterCards } from '@/components/about/CharacterCards';
import { PrayerCard } from '@/components/join/PrayerCard';
import { LetterCarousel } from '@/components/about/LetterCarousel';
import { letterAspect } from '@/content/about';

/** 총액·안내 문구처럼 카드에는 나오지만 이 목록이 갖고 있지 않은 값. 문구 편집 화면 소관이다. */
export type PreviewSite = { budgetTotal: string; prayerNote: string };

type Row = Record<string, string>;

/**
 * 편집 중인 값으로 **공개 화면의 그 카드를 그대로** 그린다.
 *
 * 화면에 쓰는 조각을 따로 만들지 않고 공개 페이지가 쓰는 컴포넌트를 그대로 불러온다.
 * 미리보기용 사본을 두면 언젠가 둘이 갈라지고, 그때부터 미리보기는 거짓말을 한다.
 *
 * 저장하지 않은 값으로 그린다 — 화면에 적어 두는 이유다.
 */
function Rendered({ config, rows, site }: { config: ListConfig; rows: Row[]; site: PreviewSite }) {
  switch (config.key) {
    case 'facts':
      return <FactsCard facts={rows.map((r) => ({ key: r.key ?? '', value: r.value ?? '' }) as Fact)} />;

    case 'characters':
      return (
        <CharacterCards
          characters={rows.map((r, i) => ({
            id: r.id || `p-${i}`,
            name: r.name ?? '',
            description: r.description ?? '',
            photoUrl: r.photo_url || null,
            sortOrder: i,
          }) as Character)}
        />
      );

    case 'timeline': {
      const events = rows.map((r, i) => ({
        id: r.id || `p-${i}`,
        period: r.period ?? '',
        title: r.title ?? '',
        status: (r.status || '예정') as TimelineStatus,
        sortOrder: i,
      })) as TimelineEvent[];
      // 공개 화면과 같은 규칙으로 두 장으로 가른다. 상태를 바꾸면 카드가 옮겨 다니는 게 보인다.
      return (
        <div className="flex flex-col gap-6">
          <TimelineCard
            title="지나온 이야기"
            note="완료된 일정"
            events={events.filter((e) => e.status === '완료')}
            tone="past"
          />
          <TimelineCard
            title="앞으로 걸어갈 이야기"
            note="진행 중인 일정"
            events={events.filter((e) => e.status !== '완료')}
            tone="ahead"
          />
        </div>
      );
    }

    case 'budget':
      return (
        <BudgetCard
          total={site.budgetTotal}
          items={rows.map((r, i) => ({ id: r.id || `p-${i}`, name: r.name ?? '', sortOrder: i }) as BudgetItem)}
        />
      );

    case 'prayers':
      return (
        <PrayerCard
          note={site.prayerNote}
          prayers={rows.map((r, i) => ({ id: r.id || `p-${i}`, text: r.text ?? '', sortOrder: i }) as Prayer)}
        />
      );

    case 'letters': {
      /*
        편지는 두 페이지로 갈라진다. 한 화면에 섞어 보여주면 실제로는 만나지 않는
        그림들이 한 줄로 이어져 보이므로, 페이지별로 따로 그린다.
      */
      const letters = rows.map((r, i) => ({
        id: r.id || `p-${i}`,
        section: (r.section || 'greeting') as AboutLetterSection,
        imageUrl: r.image_url || null,
        caption: r.caption ?? '',
        sortOrder: i,
      })) as AboutLetter[];
      const groups: { slug: AboutLetterSection; label: string }[] = [
        { slug: 'greeting', label: '01 연출의 인사말' },
        { slug: 'praysound', label: '02 Praysound에 대하여' },
      ];
      return (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.slug}>
              <p className="mb-2 text-[11px] tracking-[0.18em] text-ds-text/45">{g.label}</p>
              <LetterCarousel
                letters={letters.filter((l) => l.section === g.slug)}
                label={g.label}
                aspect={letterAspect(g.slug)}
              />
            </div>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}

/**
 * 미리보기가 터져도 편집기는 살려 둔다.
 *
 * 미리보기는 편하자고 있는 것이고 편집기는 해야 할 일이다. 입력하다 만 값
 * (예: 아직 비어 있는 이미지 주소) 하나에 카드가 예외를 던지면 React 는 화면 전체를
 * 걷어낸다 — 그러면 저장하려던 내용까지 날아간다. 여기서 끊는다.
 */
export class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <p className="py-8 text-center text-[12px] leading-[1.8] text-ds-text/45">
          지금 값으로는 미리보기를 그릴 수 없습니다.
          <br />
          편집과 저장에는 영향이 없습니다.
        </p>
      );
    }
    return this.props.children;
  }
}

/**
 * 편집기 옆에 붙는 미리보기.
 *
 * 넓은 화면에서는 편집기 오른쪽이 통째로 비어 있었다. 그 자리에 "이 값이 어느 화면의
 * 어디에 어떻게 나오는지"를 띄운다 — 저장하고 새 탭에서 공개 페이지를 열어 확인하던
 * 왕복이 사라진다.
 *
 * 좁은 화면에서는 그리지 않는다. 편집기 아래에 카드가 하나 더 붙으면 스크롤만 길어지고,
 * 폭이 좁아 실제 배치와도 다르게 보인다.
 */
export function ListPreview({ config, rows, site }: { config: ListConfig; rows: Row[]; site: PreviewSite }) {
  return (
    <aside className="hidden xl:block xl:sticky xl:top-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] tracking-[0.2em] text-ds-key2">미리보기</p>
        <a
          href={config.where.path}
          target="_blank"
          rel="noopener"
          className="text-[11px] text-ds-text/55 underline decoration-ds-text/25 underline-offset-4 hover:text-ds-key2"
        >
          {config.where.label} ↗
        </a>
      </div>

      {/*
        공개 화면과 같은 바탕(ds-bg) 위에 올린다. 관리자 패널 색 위에 얹으면 카드 테두리
        대비가 실제와 달라져, 화면에서 멀쩡한 것이 여기서만 흐려 보인다.
      */}
      <div className="mt-2 max-h-[calc(100vh-140px)] overflow-y-auto rounded-sm border border-ds-key2/15 bg-ds-bg p-4">
        <PreviewBoundary>
          <Rendered config={config} rows={rows} site={site} />
        </PreviewBoundary>
      </div>

      <p className="mt-2 text-[11px] leading-[1.7] text-ds-text/40">
        저장하기 전 화면입니다. 실제 페이지보다 폭이 좁아 줄바꿈은 다를 수 있습니다.
      </p>
    </aside>
  );
}

'use client';
import { useState } from 'react';
import type { TimelineEvent } from '../content/types';
import { TIMELINE_PREVIEW_COUNT } from '../content/process';

/**
 * 시안 `제작 과정` 01의 일정 카드.
 * `지나온 이야기`(완료)는 어두운 카드, `앞으로 걸어갈 이야기`(진행 중·예정)는 노란 카드다.
 *
 * 기본 5개만 보여주고 나머지는 `외 N개의 기록 더보기`로 접는다
 * (요구사항 명세서 24~25행). 시안은 두 카드 모두 "외 4개"로 적혀 있으나 복붙이라
 * 실제 남은 개수로 계산한다.
 */
export function TimelineCard({
  title,
  note,
  events,
  tone,
}: {
  title: string;
  note: string;
  events: TimelineEvent[];
  tone: 'past' | 'ahead';
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? events : events.slice(0, TIMELINE_PREVIEW_COUNT);
  const hidden = events.length - visible.length;

  const yellow = tone === 'ahead';
  const shell = yellow
    ? 'border-ds-key2 bg-ds-key2-fill text-ds-key1'
    : 'border-ds-key2/40 bg-ds-panel text-ds-text';
  const rule = yellow ? 'border-ds-key1/30' : 'border-ds-key2/25';
  const dot = yellow ? 'bg-ds-key1' : 'bg-ds-key2';
  const muted = yellow ? 'text-ds-key1/70' : 'text-ds-text/60';

  return (
    <section className={`rounded-lg border-[0.5px] p-[clamp(20px,3vw,36px)] ${shell}`}>
      <h2 className="flex flex-wrap items-baseline gap-2 font-heir text-[22px] leading-none">
        <span aria-hidden>✓</span>
        {title}
        <span className={`text-[14px] ${muted}`}>({note})</span>
      </h2>
      <hr className={`mt-5 border-0 border-t ${rule}`} />

      {/* 기간 표기가 `26.01.12 ~ 26.06.28`처럼 길어서 모바일에서는 날짜와 내용을 두 줄로 흘린다. */}
      {events.length === 0 ? (
        <p className={`py-8 text-center font-heir text-[15px] ${muted}`}>등록된 일정이 없습니다.</p>
      ) : (
        <ol className="m-0 mt-6 grid list-none gap-4 p-0">
          {visible.map((e) => (
            <li key={e.id} className="flex items-baseline gap-4">
              <span className={`mt-1 h-2 w-2 flex-none rounded-full ${dot}`} aria-hidden />
              <span className="flex flex-1 flex-col gap-1 sm:flex-row sm:gap-4">
                <span className="font-heir text-[15px] leading-[1.7] sm:w-[150px] sm:flex-none">
                  {e.period}
                </span>
                <span className="font-heir text-[15px] leading-[1.7]">{e.title}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      {hidden > 0 && (
        <>
          <hr className={`mt-6 border-0 border-t ${rule}`} />
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className={`tap-target mt-4 w-full cursor-pointer font-heir text-[15px] ${muted} transition-opacity hover:opacity-70`}
          >
            ⌄ 외 {hidden}개의 기록 더보기
          </button>
        </>
      )}
    </section>
  );
}

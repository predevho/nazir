import type { Prayer } from '@/content/types';

/** 시안 `후원과 기도` 02의 기도 제목 카드. 번호는 저장하지 않고 순서대로 매긴다. */
export function PrayerCard({ note, prayers }: { note: string; prayers: Prayer[] }) {
  return (
    <div className="rounded-lg border-[0.5px] border-ds-key2/30 bg-gradient-to-b from-ds-panel to-ds-bg p-[clamp(24px,4vw,44px)]">
      <h2 className="font-heir text-[26px] leading-none text-ds-key2">기도 제목</h2>
      <p className="mt-5 font-heir text-[15px] leading-[2] text-ds-text/70">{note}</p>
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
  );
}

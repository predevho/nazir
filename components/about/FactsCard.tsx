import type { Fact } from '@/content/types';

/** 시안 `〈나지르〉에 대하여` 03의 작품 개요 표. 항목명과 내용이 두 칸으로 나란히 선다. */
export function FactsCard({ facts }: { facts: Fact[] }) {
  return (
    <div className="border border-ds-key2/40 p-8">
      <h2 className="font-heir text-[26px] leading-none text-ds-key2">작품 개요</h2>
      <dl className="mt-6 m-0 grid gap-3">
        {facts.map((f) => (
          <div key={f.key} className="flex gap-6">
            <dt className="min-w-[140px] font-heir text-[15px] text-ds-key2">{f.key}</dt>
            <dd className="m-0 font-heir text-[15px] text-ds-text">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

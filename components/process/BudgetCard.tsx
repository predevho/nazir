import type { BudgetItem } from '@/content/types';

/**
 * 시안 `제작 과정` 02의 예산 카드.
 *
 * 총액만 공개하고 항목은 이름만 2열로 나열한다 — 항목별 금액은 공개하지 않기로
 * 확정된 사항이다(코멘트 #31).
 *
 * 폭에 상관없이 늘 2열이다. 예전에는 sm 미만에서 1열로 떨어뜨렸는데, 8개가 세로로
 * 늘어서면서 가운데 정렬된 짧은 라벨 옆으로 빈 자리만 길게 남았다. 라벨이 짧아
 * 390 화면의 반 칸(약 155px)에도 들어간다.
 *
 * 구분선은 "첫 줄이 아니면 윗선"이라는 한 가지 규칙이다. 1열일 때를 위해 만들어 둔
 * `i >= 2` 규칙이 그대로 남아 있어서 모바일에서는 3번째 항목 앞에만 선이 그어져 있었다.
 */
export function BudgetCard({ total, items }: { total: string; items: BudgetItem[] }) {
  return (
    <div className="rounded-lg border-[0.5px] border-ds-key2/40 p-[clamp(24px,4vw,44px)]">
      <p className="font-heir text-[clamp(20px,2.6vw,26px)] leading-none text-ds-key2">
        총 제작 예산 : {total}
      </p>
      <hr className="mt-7 border-0 border-t-[0.5px] border-ds-key2" />
      <ul className="m-0 grid list-none grid-cols-2 p-0">
        {items.map((b, i) => (
          <li
            key={b.id}
            className={`flex min-h-[clamp(56px,7vw,96px)] items-center justify-center border-ds-key2/40 break-keep px-2 py-4 text-center font-heir text-[clamp(16px,1.9vw,26px)] leading-[1.4] text-ds-text ${
              // 홀수 개로 끝나면 마지막 칸 오른쪽에 갈 곳 없는 선이 남는다
              i % 2 === 0 && i !== items.length - 1 ? 'border-r-[0.5px]' : ''
            } ${i >= 2 ? 'border-t-[0.5px]' : ''}`}
          >
            {b.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

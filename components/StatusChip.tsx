import type { TimelineStatus } from '../content/types';

const styles: Record<TimelineStatus, string> = {
  '완료': 'text-paper bg-gold-deep border-gold-deep',
  '진행 중': 'text-gold-deep bg-gold-deep/15 border-gold-deep/60',
  '예정': 'text-paper/60 bg-transparent border-paper/25',
};

export function StatusChip({ status }: { status: TimelineStatus }) {
  return (
    <span className={`font-mono text-[10px] tracking-[0.1em] px-2 py-1 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  );
}

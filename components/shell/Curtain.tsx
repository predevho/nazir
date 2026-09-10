'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// 벨벳 세로 주름: 골(어두움) → 마루(밝은 결) → 골 이 반복되는 결.
const PLEATS =
  'repeating-linear-gradient(90deg,' +
  '#1c0405 0px,#40090d 12px,#74131a 25px,#8a1a21 27px,#74131a 29px,#40090d 42px,#1c0405 52px)';
// 상단 밸런스 그림자 + 하단 어둠으로 깊이감.
const SHADE =
  'linear-gradient(to bottom,rgba(0,0,0,.55) 0%,rgba(0,0,0,0) 14%,rgba(0,0,0,0) 82%,rgba(0,0,0,.6) 100%)';

function Panel({ side }: { side: 'left' | 'right' }) {
  const slide = side === 'left' ? 'animate-curtainL' : 'animate-curtainR';
  const pos = side === 'left' ? 'left-0' : 'right-0';
  // 안쪽(맞닿는) 가장자리에 짙은 이음새 그림자.
  const seam = side === 'left' ? 'shadow-[inset_-24px_0_44px_rgba(0,0,0,.55)]' : 'shadow-[inset_24px_0_44px_rgba(0,0,0,.55)]';
  return (
    <div className={`absolute top-0 ${pos} w-1/2 h-full overflow-hidden ${slide} shadow-[0_0_60px_rgba(0,0,0,0.85)]`}>
      <div className="absolute inset-0 animate-curtainSway will-change-transform" style={{ backgroundImage: PLEATS }} />
      <div className={`absolute inset-0 ${seam}`} style={{ backgroundImage: SHADE }} />
    </div>
  );
}

export function Curtain() {
  const pathname = usePathname();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setOn(false), 2350);
    return () => clearTimeout(t);
  }, []);
  if (pathname.startsWith('/admin')) return null;
  if (!on) return null;
  return (
    <div data-testid="curtain" className="fixed inset-0 z-[200] pointer-events-none">
      <Panel side="left" />
      <Panel side="right" />
    </div>
  );
}

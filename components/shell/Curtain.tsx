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

/**
 * 막이 열리는 연출은 **홈으로 들어올 때 한 번만** 한다.
 *
 * 극장에서 막은 공연이 시작할 때 한 번 오른다. 화면을 옮길 때마다 다시 내려왔다
 * 열리면 연출이 아니라 방해가 된다 — 2.35초 동안 읽던 것이 가려진다.
 *
 * 판단 기준은 "지금 홈인가"가 아니라 **"처음 들어온 화면이 홈이었나"** 이다.
 * 이 컴포넌트는 레이아웃에 있어 화면을 옮겨도 다시 마운트되지 않으므로, 마운트 시점의
 * 경로가 곧 방문자가 사이트에 들어선 자리다. `지금 홈인가` 로 두면 다른 화면으로 들어온
 * 사람이 홈으로 이동하는 순간 막이 튀어나온다.
 */
export function Curtain() {
  const pathname = usePathname();
  // 첫 렌더의 값만 담는다. 이후 경로가 바뀌어도 이 값은 그대로다.
  const [openedAtHome] = useState(() => pathname === '/');
  const [on, setOn] = useState(true);
  useEffect(() => {
    if (!openedAtHome) return;
    const t = setTimeout(() => setOn(false), 2350);
    return () => clearTimeout(t);
  }, [openedAtHome]);
  if (!openedAtHome || !on) return null;
  return (
    <div data-testid="curtain" className="fixed inset-0 z-[200] pointer-events-none">
      <Panel side="left" />
      <Panel side="right" />
    </div>
  );
}

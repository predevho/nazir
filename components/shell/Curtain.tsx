'use client';
import { useEffect, useState } from 'react';

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
 * 막이 열리는 연출.
 *
 * **이 컴포넌트는 홈 페이지(`app/(site)/page.tsx`)에만 놓는다.** 공통 레이아웃에 두고
 * `usePathname()` 으로 홈인지 가려내던 방식은 두 가지가 어긋났다.
 *
 * 첫째, 배포 환경의 빌드 시점 프리렌더에서 `usePathname()` 이 `/` 를 돌려주지 않아
 * 서버가 "홈이 아니다"로 판단했다. 그러면 첫 화면이 잠깐 보였다가 하이드레이션 후에
 * 막이 덮는다 — 연출이 거꾸로 된다. 홈 페이지 안에 두면 경로를 물어볼 일이 없고,
 * 서버가 그리는 HTML에 막이 처음부터 들어 있다.
 *
 * 둘째, "어디에 두는가"가 곧 "어디서 뜨는가"가 된다. 조건문으로 가려내면 조건이 틀릴 수
 * 있지만, 홈 페이지에만 놓으면 다른 화면에 뜰 방법이 없다.
 *
 * 한 번 올린 막은 그 방문 동안 다시 내리지 않는다. 홈으로 돌아올 때마다 2.35초씩
 * 가리면 연출이 아니라 방해다. 새로고침하면 처음부터 다시 시작한다.
 */
// 모듈 수준 플래그. 클라이언트에서 화면을 옮겨도 유지된다.
// 서버에서는 절대 바뀌지 않는다 — 아래 useEffect 는 서버에서 돌지 않는다.
// (서버에서 켜지면 그 뒤 모든 방문자가 막을 못 보게 된다.)
let played = false;

export function Curtain() {
  const [on, setOn] = useState(() => !played);
  useEffect(() => {
    if (!on) return;
    played = true;
    const t = setTimeout(() => setOn(false), 2350);
    return () => clearTimeout(t);
  }, [on]);
  if (!on) return null;
  return (
    <div data-testid="curtain" className="fixed inset-0 z-[200] pointer-events-none">
      <Panel side="left" />
      <Panel side="right" />
    </div>
  );
}

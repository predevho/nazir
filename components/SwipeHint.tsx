'use client';

/** 한 번 보고 나면 다시 띄우지 않는다. 기기별로 남는 값이라 서버는 모른다. */
export const SWIPE_HINT_KEY = 'nazir:swipe-hint-seen';

export function hintAlreadySeen(): boolean {
  // 사파리 시크릿 모드처럼 접근 자체가 예외를 던지는 환경이 있다.
  // 못 읽으면 "아직 안 봤다"로 보고 안내를 띄운다 — 한 번 더 보는 쪽이 못 보는 쪽보다 낫다.
  try {
    return localStorage.getItem(SWIPE_HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export function markHintSeen() {
  try {
    localStorage.setItem(SWIPE_HINT_KEY, '1');
  } catch {
    /* 저장 못 해도 이번 방문 동안은 state 로 숨겨진다 */
  }
}

/**
 * 좌우로 밀어 넘길 수 있다는 것을 처음 온 사람에게 한 번만 알리는 코치마크.
 *
 * 스와이프는 화면에 아무 흔적을 남기지 않아서, 알려주지 않으면 있는 줄도 모른다.
 * 반대로 매번 띄우면 잔소리가 되므로 기기당 한 번이다.
 *
 * 손가락 기기에서만 뜬다 — 좁은 데스크톱 창에는 스와이프가 없다.
 */
export function SwipeHint({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  return (
    <div
      aria-hidden={!visible}
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-6 transition-opacity duration-300 md:hidden ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <button
        type="button"
        // 안내를 눌러 바로 치울 수 있게 한다. 그 자체가 "봤다"는 신호다.
        onClick={onDismiss}
        tabIndex={visible ? 0 : -1}
        className={`${visible ? 'pointer-events-auto' : ''} flex items-center gap-2 rounded-full border border-ds-key2/40 bg-ds-panel/90 px-4 py-2 font-heir text-[13px] leading-none text-ds-text shadow-lg backdrop-blur-sm`}
      >
        <span aria-hidden className="motion-safe:animate-swipe-nudge text-[16px] text-ds-key2">
          ‹
        </span>
        왼쪽으로 밀어 다음 장으로
      </button>
    </div>
  );
}

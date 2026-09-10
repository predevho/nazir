import '@testing-library/jest-dom/vitest';

/**
 * 이 설정의 jsdom 에는 localStorage 가 없다(window·globalThis 양쪽 다 undefined).
 * 실제 브라우저에는 있는 것이라, 없는 채로 두면 "기기에 한 번만 보여준다" 같은
 * 동작을 테스트에서 아예 확인할 수 없다. 메모리에만 두는 최소 구현을 얹는다.
 *
 * 앱 코드는 접근 자체가 예외를 던지는 환경(사파리 시크릿 모드 등)을 이미 try/catch 로
 * 감싸고 있으므로, 이 보강이 그 방어를 가리지 않는다.
 */
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    setItem: (k, v) => void store.set(k, String(v)),
    removeItem: (k) => void store.delete(k),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { value: memoryStorage, configurable: true });
  }
}

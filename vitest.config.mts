import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    // tsconfig.json이 "**/*.test.ts"를 include에서 제외하고 있어 vite-tsconfig-paths가
    // 테스트 파일 자신의 "@/" 임포트는 매핑하지 못한다. 명시적 별칭으로 보강한다.
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});

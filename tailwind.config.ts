import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        stage: '#0B0A0E',
        velvet: '#17131F',
        'velvet-2': '#1D1727',
        gold: '#E9B949',
        'gold-soft': '#F5D488',
        'gold-deep': '#8A6F2E',
        paper: '#F2EADA',
        ink: '#1A1712',
        // 시안 토큰 — docs/design-tokens.md 참고. 기존 색과 병행하며, 화면 단위로 옮겨간다.
        'ds-bg': '#0B0A0E',        // 전체 배경
        'ds-panel': '#181A1B',     // 배경색 (카드·푸터 패널)
        'ds-key1': '#2C0F09',      // 키컬러 1 (노란 면 위 텍스트)
        'ds-key2': '#DAC32D',      // 키컬러 2 (골드 강조·CTA)
        'ds-key2-fill': '#CBA610', // 카드·버튼 채우기 노랑
        'ds-text': '#D9D9D9',      // 흰글자색 (본문)
      },
      maxWidth: {
        content: '1398px', // 시안 콘텐츠 폭 (1920 - 좌우 261)
      },
      fontFamily: {
        display: ["'Gowun Batang'", 'serif'],
        body: ["'IBM Plex Sans KR'", 'system-ui', 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace'],
        // 시안 폰트. 파일은 public/fonts/ (README.md 참고), 없으면 아래 대체 폰트로 렌더링된다.
        heir: ["'Heir of Light'", "'Gowun Batang'", 'serif'],
        griun: ["'Griun Gossi'", "'Gowun Batang'", 'serif'],
      },
      keyframes: {
        curtainL: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-101%)' } },
        curtainR: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(101%)' } },
        curtainSway: {
          '0%,100%': { backgroundPositionX: '0px', transform: 'skewX(0deg) scaleX(1)' },
          '50%': { backgroundPositionX: '15px', transform: 'skewX(-1.1deg) scaleX(1.02)' },
        },
        riseIn: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glow: { '0%,100%': { opacity: '.55' }, '50%': { opacity: '.9' } },
      },
      animation: {
        curtainL: 'curtainL 1.3s cubic-bezier(.7,0,.2,1) .95s forwards',
        curtainR: 'curtainR 1.3s cubic-bezier(.7,0,.2,1) .95s forwards',
        curtainSway: 'curtainSway 2.4s ease-in-out infinite',
        glow: 'glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

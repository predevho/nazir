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
      },
      fontFamily: {
        display: ["'Gowun Batang'", 'serif'],
        body: ["'IBM Plex Sans KR'", 'system-ui', 'sans-serif'],
        mono: ["'IBM Plex Mono'", 'monospace'],
      },
      keyframes: {
        curtainL: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-101%)' } },
        curtainR: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(101%)' } },
        riseIn: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glow: { '0%,100%': { opacity: '.55' }, '50%': { opacity: '.9' } },
      },
      animation: {
        curtainL: 'curtainL 1.3s cubic-bezier(.7,0,.2,1) .25s forwards',
        curtainR: 'curtainR 1.3s cubic-bezier(.7,0,.2,1) .25s forwards',
        glow: 'glow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;

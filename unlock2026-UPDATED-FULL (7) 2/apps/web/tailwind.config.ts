import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        unlock: {
          bg: '#0a1628',
          card: 'rgba(15, 30, 55, 0.95)',
          gold: '#FFD700',
          green: '#00FF88',
          orange: '#FF8C00',
          purple: '#9B6DFF',
          red: '#FF4444',
          cyan: '#00BFFF',
          white: '#E8E8E8',
          gray: '#8899aa',
        },
      },
      fontFamily: {
        title: ['Orbitron', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'grid-move': 'gridMove 25s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        gridMove: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-60px, -60px, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 215, 0, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

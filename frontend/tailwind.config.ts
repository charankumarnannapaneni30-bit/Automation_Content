import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}', './lib/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#07151f',
        panel: '#0f1f2d',
        primary: '#6ee7f9',
        secondary: '#8b5cf6',
        success: '#34d399',
        warn: '#fbbf24',
        danger: '#f87171',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(110,231,249,0.2), 0 15px 50px rgba(110,231,249,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;

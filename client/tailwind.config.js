/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          950: '#0a0a0c',
          900: '#101014',
          850: '#16161c',
          800: '#1c1c24',
          700: '#26262f',
          600: '#33333f',
        },
        accent: {
          DEFAULT: '#ef4444',
          dim: '#b91c1c',
          glow: '#f87171',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};

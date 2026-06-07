/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Main surface palette (light mode)
        base: {
          950: '#FFFFFF',
          900: '#F9FAFB',
          850: '#F3F4F6',
          800: '#E5E7EB',
          700: '#D1D5DB',
          600: '#9CA3AF',
        },
        // Primary accent — green
        accent: {
          DEFAULT: '#16A34A',
          dim: '#15803D',
          glow: '#22C55E',
          light: '#DCFCE7',
        },
        // Secondary accent — blue
        brand: {
          blue: '#2563EB',
          'blue-dim': '#1D4ED8',
          'blue-light': '#EFF6FF',
        },
        // Sidebar-specific (dark)
        sidebar: {
          bg: '#0D0D0D',
          border: '#262626',
          hover: '#1C1C1C',
          active: '#052e16',
          'active-text': '#4ade80',
          text: '#F9FAFB',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.12)',
        'green-glow': '0 0 20px rgb(22 163 74 / 0.3)',
      },
    },
  },
  plugins: [],
};

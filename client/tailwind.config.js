/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Main surface palette — cool neutral (slate) ramp for a crisp, technical feel
        base: {
          950: '#FFFFFF',
          900: '#F8FAFC', // app background
          850: '#F1F5F9', // subtle fills / hover
          800: '#EAEEF3', // light dividers
          700: '#E2E8F0', // borders (soft, crisp)
          600: '#94A3B8', // muted icons / hairlines
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
          bg: '#0A0A0B',
          border: '#1F1F23',
          hover: '#18181B',
          active: '#0B2E1A',
          'active-text': '#4ADE80',
          text: '#FAFAFA',
          muted: '#71717A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        tightish: '-0.011em',
      },
      boxShadow: {
        // Soft, cool-tinted, layered — crisp without looking heavy
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.05)',
        'card-hover': '0 6px 20px -4px rgb(15 23 42 / 0.12), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
        'green-glow': '0 0 0 1px rgb(22 163 74 / 0.2), 0 4px 14px -2px rgb(22 163 74 / 0.35)',
        'btn': '0 1px 2px 0 rgb(15 23 42 / 0.08)',
        'brand-mark': '0 0 0 1px rgb(34 197 94 / 0.25), 0 4px 16px -4px rgb(34 197 94 / 0.45)',
      },
      backgroundImage: {
        // Brand signature — green→blue, the "Norwall / REDBASE" identity
        'brand-gradient': 'linear-gradient(135deg, #16A34A 0%, #15803D 45%, #1D4ED8 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #22C55E 0%, #2563EB 100%)',
        // Subtle radial glow for the console sidebar header
        'sidebar-glow': 'radial-gradient(130% 70% at 50% -10%, rgba(34,197,94,0.12), transparent 65%)',
        'grid-faint': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

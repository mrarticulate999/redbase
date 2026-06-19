/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Main surface palette — cool neutral (slate) ramp for a crisp, technical feel
        base: {
          950: '#FFFFFF',
          900: '#F7F8FA', // app background (a touch warmer/quieter than pure slate-50)
          850: '#F1F4F8', // subtle fills / hover
          800: '#E8ECF2', // light dividers
          700: '#E0E5EC', // borders (soft, crisp)
          600: '#94A3B8', // muted icons / hairlines
        },
        // Ink — deep near-black for headings (more confident than slate-900)
        ink: '#0B1220',
        // Primary accent — green (the single confident brand action color)
        accent: {
          DEFAULT: '#15924B',
          dim: '#0F7A3D',
          glow: '#22C55E',
          light: '#E6F6EC',
        },
        // Blue is data-viz ONLY now (no longer a second brand action color)
        brand: {
          blue: '#2563EB',
          'blue-dim': '#1D4ED8',
          'blue-light': '#EFF6FF',
        },
        // Data-visualization ramp (charts only) — distinct from brand actions
        viz: {
          1: '#15924B', 2: '#2563EB', 3: '#0891B2', 4: '#D97706', 5: '#7C3AED', 6: '#DB2777',
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
        // Brand signature — single green family (deep→bright), an intentional
        // "secure console" mark rather than an AI-slop green→blue gradient.
        'brand-gradient': 'linear-gradient(150deg, #0F7A3D 0%, #15924B 55%, #1FB85C 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #15924B 0%, #1FB85C 100%)',
        // Subtle radial glow for the console sidebar header
        'sidebar-glow': 'radial-gradient(130% 70% at 50% -10%, rgba(34,197,94,0.14), transparent 65%)',
        // Signature detail: faint engineering grid + hairline scanline for headers
        'grid-faint': 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'console-grid': 'linear-gradient(rgba(11,18,32,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(11,18,32,0.025) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

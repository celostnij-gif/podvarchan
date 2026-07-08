import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Shared design tokens — match public site
        'bg-deep': '#050508',
        'bg-base': '#0A0A12',
        'bg-surface': '#12121E',
        'bg-elevated': '#1A1A2E',
        'bg-highlight': '#24243A',
        'gold': '#C9A96E',
        'gold-light': '#E3C47A',
        'gold-dark': '#A8874A',
        'gold-muted': '#9C7F4A',
        'text-primary': '#ECEBF2',
        'text-secondary': '#B0AEBF',
        'text-muted': '#7C7A8F',
        'border-base': '#1E1E30',
        'border-light': '#2A2A42',
        // Dark-theme overrides for standard Tailwind grays
        gray: {
          50:  '#0F0F1A',
          100: '#12121E',
          200: '#1A1A2E',
          300: '#24243A',
          400: '#2A2A42',
          500: '#7C7A8F',
          600: '#B0AEBF',
          700: '#D1D5DB',
          800: '#E8E7EE',
          900: '#ECEBF2',
          950: '#F5F4FA',
        },
        // Dark-theme overrides for status colors
        blue: {
          50:  'rgba(201,169,110,0.08)',
          100: 'rgba(201,169,110,0.12)',
          200: 'rgba(201,169,110,0.25)',
          400: '#C9A96E',
          500: '#C9A96E',
          600: '#C9A96E',
          700: '#A8874A',
          800: '#E3C47A',
        },
        green: {
          50:  '#152D20',
          100: '#152D20',
          200: '#1D3F32',
          600: '#40916C',
          700: '#40916C',
          800: '#52B788',
        },
        red: {
          50:  '#2D1520',
          100: '#2D1520',
          200: '#3D1A28',
          600: '#D4455A',
          700: '#D4455A',
          800: '#E86A7C',
        },
        yellow: {
          50:  '#2D2515',
          100: '#2D2515',
          200: '#3D3020',
          600: '#C9A96E',
          700: '#E3C47A',
          800: '#E3C47A',
        },
        amber: {
          600: '#C9A96E',
          500: '#E3C47A',
        },
        purple: {
          100: '#22153A',
          800: '#A78BFA',
        },
        orange: {
          100: '#2D1A15',
          400: '#F97316',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        '3xl': '3rem',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}

export default config

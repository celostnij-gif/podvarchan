import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Background layers (deep → raised)
        'bg-deep': '#050508',
        'bg-base': '#0A0A12',
        'bg-surface': '#12121E',
        'bg-elevated': '#1A1A2E',
        'bg-highlight': '#24243A',

        // Gold accent — warmth, premium, candlelight
        'gold': '#C9A96E',
        'gold-light': '#E3C47A',
        'gold-dark': '#A8874A',
        'gold-muted': '#9C7F4A',

        // Forest green — secondary, calm, nature
        'green': '#2D6A4F',
        'green-light': '#40916C',
        'green-deep': '#1B4332',
        'green-muted': '#1D3F32',

      '--color-gold-muted': '#9C7F4A',
        'text-primary': '#ECEBF2',
        'text-secondary': '#B0AEBF',
        'text-muted': '#7C7A8F',

        // Borders
        'border-base': '#1E1E30',
        'border-light': '#2A2A42',

        // Status
        'error': '#D4455A',
        'error-bg': '#2D1520',
        'success': '#40916C',
        'success-bg': '#152D20',
        'warning': '#C9A96E',
        'warning-bg': '#2D2515',
      },

      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.75rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        '3xl': ['2rem', { lineHeight: '1.3' }],
        '4xl': ['2.5rem', { lineHeight: '1.2' }],
        '5xl': ['3.5rem', { lineHeight: '1.1' }],
        '6xl': ['4.5rem', { lineHeight: '1.05' }],
        '7xl': ['5.5rem', { lineHeight: '1.02' }],
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

      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0,0,0,0.4)',
        'DEFAULT': '0 2px 8px rgba(0,0,0,0.3)',
        'md': '0 4px 16px rgba(0,0,0,0.35)',
        'lg': '0 8px 32px rgba(0,0,0,0.4)',
        'xl': '0 12px 48px rgba(0,0,0,0.45)',
        'glow-gold': '0 0 20px rgba(201, 169, 110, 0.15), 0 0 40px rgba(201, 169, 110, 0.05)',
        'glow-green': '0 0 20px rgba(45, 106, 79, 0.2)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
        'inner-glow-strong': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },

      spacing: {
        'section': '7.5rem',     // 120px
        'section-sm': '4rem',    // 64px
        'gutter': '1.5rem',      // 24px
      },

      maxWidth: {
        'container': '75rem',    // 1200px
        'container-sm': '56rem', // 896px
        'container-xs': '40rem', // 640px
      },

      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 169, 110, 0.12)' },
          '50%': { boxShadow: '0 0 35px rgba(201, 169, 110, 0.3)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.6s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.7s ease-out forwards',
        'fade-in-down': 'fade-in-down 0.5s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.6s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.6s ease-out forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'gradient-shift': 'gradient-shift 4s ease-in-out infinite',
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-subtle': 'linear-gradient(135deg, #12121E 0%, #0A0A12 100%)',
        'gradient-gold': 'linear-gradient(135deg, #C9A96E 0%, #A8874A 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(18, 18, 30, 0.8) 0%, rgba(18, 18, 30, 0.2) 100%)',
        'gradient-hero': 'radial-gradient(ellipse at 50% 0%, rgba(201, 169, 110, 0.08) 0%, transparent 60%)',
      },

      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },

      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}

export default config

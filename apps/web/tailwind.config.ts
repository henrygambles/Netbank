import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        coral: {
          50: '#fff0f3', 100: '#ffe0e8', 200: '#ffc0d1', 300: '#ff91ac',
          400: '#ff5580', 500: '#ff3465', 600: '#ed1044', 700: '#c80738',
          800: '#a80934', 900: '#8f0c31',
        },
        navy: {
          50: '#f0f1f9', 100: '#e3e5f4', 200: '#cccfeb', 300: '#abaddc',
          400: '#8688ca', 500: '#6b6db6', 600: '#5a57a0', 700: '#4d4a87',
          800: '#41406e', 900: '#1a1a2e', 950: '#0d0d1a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'slide-up': 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2s infinite',
        'pulse-coral': 'pulseCoral 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseCoral: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 52, 101, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(255, 52, 101, 0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'gradient-coral': 'linear-gradient(135deg, #ff3465 0%, #ff7043 100%)',
        'gradient-navy': 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        'gradient-gold': 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'coral': '0 8px 32px rgba(255, 52, 101, 0.35)',
        'card': '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
        'glass': '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
      },
    },
  },
  plugins: [],
}

export default config

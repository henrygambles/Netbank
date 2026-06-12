export const colors = {
  coral: {
    50: '#fff0f3',
    100: '#ffe0e8',
    200: '#ffc0d1',
    300: '#ff91ac',
    400: '#ff5580',
    500: '#ff3465',
    600: '#ed1044',
    700: '#c80738',
    800: '#a80934',
    900: '#8f0c31',
  },
  navy: {
    50: '#f0f1f9',
    100: '#e3e5f4',
    200: '#cccfeb',
    300: '#abaddc',
    400: '#8688ca',
    500: '#6b6db6',
    600: '#5a57a0',
    700: '#4d4a87',
    800: '#41406e',
    900: '#1a1a2e',
    950: '#0d0d1a',
  },
  slate: {
    50: '#f8f9fc',
    100: '#f0f2f8',
    200: '#e2e6f0',
    300: '#cdd4e3',
    400: '#9aa5be',
    500: '#6b7a99',
    600: '#4d5a76',
    700: '#374157',
    800: '#232a3b',
    900: '#141927',
  },
  success: {
    light: '#e6f9f0',
    default: '#00c853',
    dark: '#00a344',
  },
  warning: {
    light: '#fff8e1',
    default: '#ffc107',
    dark: '#e65100',
  },
  error: {
    light: '#ffebee',
    default: '#f44336',
    dark: '#c62828',
  },
  white: '#ffffff',
  black: '#000000',
} as const

export const gradients = {
  coral: 'linear-gradient(135deg, #ff3465 0%, #ff7043 100%)',
  navy: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  midnight: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 100%)',
  gold: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  emerald: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  purple: 'linear-gradient(135deg, #7b2ff7 0%, #f107a3 100%)',
  blue: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
} as const

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
  },
} as const

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const

export const borderRadius = {
  none: '0',
  sm: '0.375rem',
  base: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  base: '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
  md: '0 8px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04)',
  lg: '0 16px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)',
  xl: '0 24px 64px rgba(0,0,0,0.16)',
  coral: '0 8px 32px rgba(255, 52, 101, 0.35)',
  navy: '0 8px 32px rgba(26, 26, 46, 0.5)',
} as const

export const animation = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '350ms',
    slower: '500ms',
  },
  easing: {
    out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0.0, 1, 1)',
    inOut: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  },
} as const

export const cardColors = [
  { bg: '#ff3465', label: 'coral' },
  { bg: '#1a1a2e', label: 'navy' },
  { bg: '#7b2ff7', label: 'purple' },
  { bg: '#11998e', label: 'emerald' },
  { bg: '#f7971e', label: 'gold' },
  { bg: '#2193b0', label: 'ocean' },
  { bg: '#e91e63', label: 'pink' },
  { bg: '#43a047', label: 'green' },
] as const

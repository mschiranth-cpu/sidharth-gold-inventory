/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom Gold Theme
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Amber accent for gold theme
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Primary brand colors
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },
        // Success/Error/Warning states
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        // ============================================
        // V2 Dashboard luxe palette — champagne + onyx
        // ============================================
        champagne: {
          50: '#FBF7EF',
          100: '#F4ECD8',
          200: '#EADDB7',
          300: '#DCC791',
          400: '#CFB16C',
          500: '#BC9750',
          600: '#9C7A3D',
          700: '#7A5E2E',
          800: '#5A4421',
          900: '#3B2D16',
        },
        onyx: {
          50: '#F5F5F7',
          100: '#E2E2E6',
          200: '#B7B7BD',
          300: '#8A8A92',
          400: '#5C5C66',
          500: '#3A3A42',
          600: '#26262C',
          700: '#1A1A1F',
          800: '#141418',
          900: '#0F0F12',
        },
        'gold-leaf': '#C9A55C',
        pearl: '#F8F4ED',
        accent: {
          emerald: '#1F8A6F',
          ruby: '#B43A4A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        112: '28rem',
        128: '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        gold: '0 4px 14px 0 rgba(234, 179, 8, 0.39)',
        'gold-lg': '0 10px 40px 0 rgba(234, 179, 8, 0.3)',
        'inner-gold': 'inset 0 2px 4px 0 rgba(234, 179, 8, 0.1)',
        luxe: '0 18px 48px -16px rgba(58, 44, 22, 0.28), 0 4px 14px -6px rgba(58, 44, 22, 0.18)',
        onyx: '0 24px 60px -20px rgba(15, 15, 18, 0.55), 0 6px 18px -8px rgba(15, 15, 18, 0.4)',
        pearl: '0 1px 2px 0 rgba(58, 44, 22, 0.06), 0 8px 22px -10px rgba(58, 44, 22, 0.18)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        'gold-gradient-radial':
          'radial-gradient(ellipse at center, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
        'dark-gold-gradient': 'linear-gradient(135deg, #92400e 0%, #78350f 50%, #451a03 100%)',
        'champagne-gradient':
          'linear-gradient(135deg, #FBF7EF 0%, #F4ECD8 45%, #EADDB7 100%)',
        'onyx-gradient':
          'linear-gradient(135deg, #1A1A1F 0%, #141418 50%, #0F0F12 100%)',
        'gold-leaf-gradient':
          'linear-gradient(135deg, #DCC791 0%, #C9A55C 50%, #9C7A3D 100%)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'subtle-shake': 'subtleShake 0.5s ease-in-out',
        'badge-pop': 'badgePop 0.3s ease-out',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        subtleShake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-10deg)' },
          '75%': { transform: 'rotate(10deg)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        'btn-pulse-effect': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.5)' },
          '50%': { boxShadow: '0 0 0 12px rgba(245, 158, 11, 0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      transitionDuration: {
        400: '400ms',
        500: '500ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
        'in-out-back': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      },
    },
  },
  plugins: [],
};

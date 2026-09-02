/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          800: '#1E293B',
          900: '#0F172A',
          950: '#080C14',
          999: '#030712',
        },
        gold: {
          50: '#FFFDF5',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.65)',
          'surface-dark': 'rgba(15, 23, 42, 0.65)',
          border: 'rgba(255, 255, 255, 0.25)',
          'border-dark': 'rgba(255, 255, 255, 0.08)',
          'border-gold': 'rgba(245, 158, 11, 0.25)',
        },
      },
      fontFamily: {
        serif: ['Cinzel', 'Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Cinzel', 'serif'],
        editorial: ['Cormorant Garamond', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.35)',
        'gold-glow': '0 0 25px rgba(245, 158, 11, 0.18)',
        'gold-glow-lg': '0 0 50px rgba(245, 158, 11, 0.25)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

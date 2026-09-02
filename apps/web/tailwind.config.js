/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          start: '#EEF2FF',
          end: '#E0E7FF',
        },
        glass: {
          surface: 'rgba(255, 255, 255, 0.55)',
          'surface-dark': 'rgba(17, 24, 39, 0.45)',
          border: 'rgba(255, 255, 255, 0.35)',
        },
        ink: '#0F172A',
        slate: '#475569',
        muted: '#94A3B8',
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'star-gold': '#FBBF24',
      },
      borderRadius: {
        button: '10px',
        card: '16px',
        modal: '20px',
        floating: '16px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(31, 38, 135, 0.12)',
      },
      backdropBlur: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

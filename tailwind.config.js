/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#070713',
          850: '#0b0b1a',
          800: '#0f1020',
          700: '#161830',
          600: '#1e2040',
          500: '#2a2d52',
        },
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          200: '#bcd2ff',
          300: '#8fb4ff',
          400: '#5e8eff',
          500: '#3b6bff',
          600: '#2a4ef5',
          700: '#223bd8',
          800: '#1f31a8',
          900: '#1e2c82',
        },
        accent: {
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3b6bff 0%, #a855f7 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgba(59,107,255,0.18) 0%, rgba(168,85,247,0.18) 100%)',
        'hero-radial': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59,107,255,0.35), rgba(168,85,247,0.18) 40%, transparent 70%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'float-slow': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'dash': {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '60%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.4s ease-out forwards',
        'float-slow': 'float-slow 7s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        'dash': 'dash 1.2s ease-out forwards',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
      },
    },
  },
  plugins: [],
};

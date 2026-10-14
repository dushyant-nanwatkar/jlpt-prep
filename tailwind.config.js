/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'ui-sans-serif', 'sans-serif'],
        japanese: ['Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        primary: '#9ECAFE',
        'primary-on': '#003258',
        'primary-dim': '#68A7F8',
        secondary: '#BBC7DB',
        tertiary: '#D7B8EE',
        success: '#75F0BA',
        warning: '#FFD180',
        error: '#FFB4AB',
        surface: '#000000',
        'surface-1': '#080B12',
        'surface-2': '#0A0D14',
        'surface-3': '#0E131F',
        'surface-4': '#121622',
        'surface-5': '#171D2E',
        'surface-6': '#1C2338',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #9ECAFE 0%, #68A7F8 100%)',
        'gradient-aurora': 'linear-gradient(135deg, #9ECAFE 0%, #D7B8EE 50%, #75F0BA 100%)',
        'gradient-card': 'linear-gradient(145deg, rgba(14,18,28,0.9) 0%, rgba(10,13,20,0.95) 100%)',
        'glow-spot': 'radial-gradient(circle at center, rgba(158,202,254,0.18) 0%, transparent 70%)',
        'glow-spot-purple': 'radial-gradient(circle at center, rgba(215,184,238,0.18) 0%, transparent 70%)',
        'glow-spot-green': 'radial-gradient(circle at center, rgba(117,240,186,0.18) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-primary': '0 0 30px rgba(158, 202, 254, 0.25)',
        'glow-primary-lg': '0 0 60px rgba(158, 202, 254, 0.3)',
        'glow-tertiary': '0 0 30px rgba(215, 184, 238, 0.2)',
        'glow-success': '0 0 30px rgba(117, 240, 186, 0.2)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.7)',
        'card-hover': '0 16px 48px rgba(0, 0, 0, 0.8)',
        'float': '0 20px 60px rgba(0, 0, 0, 0.8)',
      },
      borderRadius: {
        '2.5xl': '20px',
        '4xl': '2rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fadeIn 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        'shimmer': 'shimmer 1.8s infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(158, 202, 254, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(158, 202, 254, 0.5)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}

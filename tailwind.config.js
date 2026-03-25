/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Satoshi', 'system-ui', 'sans-serif'] },
      colors: {
        navy: { DEFAULT: '#0f2557', deep: '#081840', mid: '#1a3a7a' },
        blue: { DEFAULT: '#2952cc', soft: '#e8effe' },
        brand: { DEFAULT: '#f2a93b', light: '#fff4e6', dark: '#d4892a' },
      },
      boxShadow: {
        card:  '0 4px 16px rgba(0,0,0,.08)',
        hover: '0 20px 50px rgba(15,37,87,.14)',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'none' } },
        bounce3: { '0%,80%,100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        'fade-up': 'fadeUp .6s cubic-bezier(.16,1,.3,1) forwards',
        'bounce3': 'bounce3 1.2s infinite',
      },
    },
  },
  plugins: [],
}
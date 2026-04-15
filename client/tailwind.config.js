/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: '#e07000',
        'saffron-light': '#ff9010',
        'saffron-pale': '#fff0d6',
        cream: '#fffdf7',
        'cream-mid': '#fef3e0',
        'brown-dark': '#2d1a00',
        'brown-mid': '#7a3300',
        'brown-light': '#c05a00',
        gold: '#d4af37',
        'gold-light': '#f0cc5a',
        'gold-pale': '#fdf3c8',
        leaf: '#2d5a1b',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        cormorant: ['Cormorant Garamond', 'serif'],
        poppins: ['Poppins', 'sans-serif'],
        devanagari: ['Noto Serif Devanagari', 'serif'],
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: 'translateY(28px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0) rotate(-2deg)' }, '50%': { transform: 'translateY(-14px) rotate(2deg)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        gradientShift: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        marqueeScroll: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        pulse2: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.04)' } },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s ease both',
        float: 'float 5s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        gradientShift: 'gradientShift 8s ease infinite',
        marqueeScroll: 'marqueeScroll 28s linear infinite',
        spinSlow: 'spinSlow 30s linear infinite',
        pulse2: 'pulse2 2.5s ease-in-out infinite',
      },
      backgroundSize: {
        '300%': '300% 300%',
        '200%': '200% auto',
      },
      boxShadow: {
        saffron: '0 8px 32px rgba(224,112,0,0.15)',
        'saffron-lg': '0 20px 60px rgba(224,112,0,0.20)',
        gold: '0 4px 20px rgba(212,175,55,0.4)',
      },
      borderRadius: {
        'xl2': '18px',
        'xl3': '28px',
      },
    },
  },
  plugins: [],
};

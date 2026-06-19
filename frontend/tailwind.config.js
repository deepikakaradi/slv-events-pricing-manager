/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        luxury: {
          50: '#FAF9F6', // Alabaster/Off-white
          100: '#F3F1EB',
          200: '#E7E3D4',
          300: '#D5CEB4',
          400: '#BEB28E', // Matte Gold
          500: '#A4956C', // Gold Accent
          600: '#8A7A53',
          700: '#6E603F',
          800: '#53482F',
          900: '#383020',
          950: '#1C1810',
        },
        slate: {
          950: '#0B0F19', // Linear/Stripe style deep blue-black
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

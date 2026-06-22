/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff4eb',
          100: '#ffe0cc',
          500: '#ff8533',
          600: '#ff6600',
          700: '#e55c00',
          800: '#cc5200',
          900: '#993d00',
        },
        'brand-black': '#1a1a1a',
      }
    },
  },
  plugins: [],
}

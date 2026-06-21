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
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#c5b222ff',
          600: '#a37b16ff',
          700: '#b28325ff',
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7ee',
          100: '#fdedd6',
          200: '#f9d7ad',
          300: '#f5ba78',
          400: '#f09441',
          500: '#ec7a1c',
          600: '#dd6012',
          700: '#b74811',
          800: '#923a16',
          900: '#763214',
        },
        secondary: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae2',
          300: '#b1bac9',
          400: '#8794ab',
          500: '#687890',
          600: '#536077',
          700: '#444e61',
          800: '#3b4352',
          900: '#343a46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

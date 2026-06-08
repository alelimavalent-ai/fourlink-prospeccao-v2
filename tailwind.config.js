/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fourlink: {
          navy: '#1B2F5E',
          red: '#C8311A',
        }
      }
    },
  },
  plugins: [],
}

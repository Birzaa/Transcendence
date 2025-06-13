// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html", // Pour tes fichiers HTML
    "./src/**/*.{js,ts,jsx,tsx}", // Pour tes fichiers TypeScript où tu utilises les classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
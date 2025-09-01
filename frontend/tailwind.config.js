/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-bg': "url('/images/background.png')",
      },
      colors: {
        'baby-pink': '#f8d2ff',  // Baby pink légèrement violacé
        'baby-pink-dark': '#ea82fd', // Variante plus foncée (optionnelle)
        'darkest-pink': '#d916fc',
        'darkest-pink' : '#de28ff', // Rose très foncé
        'baby-blue': '#cfd1fe', //d9e6fd
        'darkest-blue': '#878bfe', // 7caafc
        'pastel-yellow': '#fdfdd6', //fcfcc9
        'pastel-yellow2': '#fef6b0', //fef1c8
        'dark-yellow': '#fee616',
      },
    },
  },
  plugins: [],
}
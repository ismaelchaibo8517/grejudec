/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Procura classes em todos os ficheiros JS, TS, JSX e TSX dentro de src
  ],
  theme: {
    extend: {
      // Aqui podes personalizar cores, fontes ou espaçamentos do GREJUDEC no futuro
      colors: {
        brand: {
          light: '#3b82f6',
          DEFAULT: '#1d4ed8',
          dark: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
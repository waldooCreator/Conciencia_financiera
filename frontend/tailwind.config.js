/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        noir: '#030706',
        denim: '#20394a',
        bone: '#f9f5ed',
        steel: '#6196aa',
        concrete: '#c9ccc3',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

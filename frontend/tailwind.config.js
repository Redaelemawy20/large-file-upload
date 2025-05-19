/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0d87e9',
        secondary: '#5380af',
        accent: '#ee3f5c',
        neutral: '#545454',
      },
    },
  },
  plugins: [],
};

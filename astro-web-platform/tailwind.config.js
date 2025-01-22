/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
}


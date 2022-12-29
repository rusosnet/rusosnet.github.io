/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['content/**/*.md', 'layouts/**/*.html', './node_modules/flowbite/**/*.js'],
  theme: {
    extend: {},
  },
  plugins: [require('flowbite/plugin')],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './index.html'],
  theme: {
    extend: {
      colors: {
        poe: {
          gold: '#AF9A5A',
          dark: '#0D0D0D',
          panel: '#1A1612',
          border: '#3D3325',
          text: '#D4C48A',
          muted: '#9A8A6A',
          gem: '#1BA29A',
          notable: '#9B6DC7',
          item: '#E89B3A',
          life: '#5A1A1A',
          mana: '#1A2A5A',
        }
      }
    }
  },
  plugins: []
}

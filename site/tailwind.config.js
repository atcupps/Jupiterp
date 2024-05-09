/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'selector',
  theme: {
    colors: {
      /* general themes */
      transparent: 'transparent',
      current: 'currentColor',
      'white': '#ffffff',
      'black': '#000000',
      'orange': '#F6743C',
      'lightOrange': '#ffc4ab',
      'midGray': '#888888',
      
      /* light mode themes */
      'bgLight': 'white',
      'bgSecondaryLight': '#EBEBEB',
      'textLight': 'black',
      'divBorderLight': '#F1F1F1',
      'outlineLight': '#A2AABD',
      'secCodesLight': '#667085',
      'hoverLight': '#d8d8d8',

      /* dark mode themes */
      'bgDark': '#151922',
      'bgSecondaryDark': '#141721',
      'textDark': '#D9DFEA',
      'divBorderDark': '#252E3E',
      'outlineDark': '#47526A',
      'secCodesDark': '#667085',
      'hoverDark': '#30374a',
      // 'hoverDark': '#222736',
    },
    extend: {
      keyframes: {
        fadeOut: {
          from: { opacity: '1', display: 'visible' },
          to: { opacity: '0', display: 'hidden' }
        }
      },
      animation: {
        fadeOut: 'fadeOut 0.75s forwards'
      }
    }
  },
  plugins: []
};
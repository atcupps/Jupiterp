/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    colors: {
      /* general themes */
      transparent: 'transparent',
      current: 'currentColor',
      'white': '#ffffff',
      'black': '#000000',
      'orange': '#F6743C',

      /* light mode themes */
      'bgLight': 'white',
      'bgSecondaryLight': '#EBEBEB',
      'textLight': 'black',
      'divBorderLight': '#F1F1F1',
      'outlineLight': '#A2AABD',
      'secCodesLight': '#667085',
      'hoverLight': '#e3e3e3',

      /* dark mode themes */
      'bgDark': '#151922',
      'bgSecondaryDark': '#141721',
      'textDark': '#D9DFEA',
      'divBorderDark': '#252E3E',
      'outlineDark': '#47526A',
      'secCodesDark': '#667085',
      'hoverDark': '222736'
    }
  },
  plugins: []
};
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'selector',
	theme: {
		colors: {
			/* general themes */
			transparent: 'transparent',
			current: 'currentColor',
			white: '#ffffff',
			black: '#000000',
			orange: '#F6743C',
			lightOrange: '#ffc4ab',
			midGray: '#888888',

			/* light mode themes */
			bgLight: 'white',
			bgSecondaryLight: '#EBEBEB',
			textLight: 'black',
			divBorderLight: '#F1F1F1',
			outlineLight: '#A2AABD',
			secCodesLight: '#667085',
			hoverLight: '#d8d8d8',

			/* dark mode themes */
			bgDark: '#151922',
			bgSecondaryDark: '#141721',
			textDark: '#D9DFEA',
			divBorderDark: '#252E3E',
			outlineDark: '#47526A',
			secCodesDark: '#667085',
			hoverDark: '#30374a',

			/* GPA chip tiers (paired light/dark) */
			gpaGoodLight: '#15803D',
			gpaGoodDark: '#4ADE80',
			gpaMidLight: '#A16207',
			gpaMidDark: '#FACC15',
			gpaLowLight: '#B91C1C',
			gpaLowDark: '#F87171',

			/* grade distribution bar fills; within a bucket, plus grades
			are darkest and minus grades lightest. D reuses `orange`. */
			gradeAPlus: '#147A3D',
			gradeA: '#2FA85E',
			gradeAMinus: '#6FCB93',
			gradeBPlus: '#6E8F24',
			gradeB: '#93B83C',
			gradeBMinus: '#B7D06E',
			gradeCPlus: '#B8901F',
			gradeC: '#E0B63C',
			gradeCMinus: '#ECCF7C',
			gradeDPlus: '#C9511F',
			gradeDMinus: '#FA9E77',
			gradeF: '#E5534B'
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
	plugins: [forms]
};

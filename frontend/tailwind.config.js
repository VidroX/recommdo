module.exports = {
	purge: ['./src/**/*.{js,ts,jsx,tsx}'],
	darkMode: 'media',
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: '#02C2A8',
					light: '#00e9ca',
					dark: '#008d7a',
				},
			},
			minWidth: {
				150: '150px',
				450: '450px',
				'25-percent': '25%',
				'50-percent': '50%',
				'75-percent': '75%',
			},
			maxWidth: {
				150: '150px',
				450: '450px',
				'25-percent': '25%',
				'50-percent': '50%',
				'75-percent': '75%',
			},
		},
	},
	variants: {
		extend: {},
	},
	plugins: [require('@tailwindcss/forms')],
};
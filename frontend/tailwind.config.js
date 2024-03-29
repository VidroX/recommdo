module.exports = {
	purge: ['./src/**/*.{js,ts,jsx,tsx}'],
	darkMode: 'media',
	theme: {
		extend: {
			screens: {
				'xs': '320px',
			},
			flex: {
				'2': '2 1 0%',
				'3': '3 1 0%',
				'4': '4 1 0%',
			},
			colors: {
				primary: {
					DEFAULT: '#02C2A8',
					light: '#00e9ca',
					dark: '#008d7a',
				},
				overlay: 'rgba(0,0,0,0.25)',
				danger: {
					DEFAULT: '#f55656',
					light: '#fc7d7d',
					dark: '#c82f2f',
				},
			},
			scale: {
				101: '1.01',
				102: '1.02',
				103: '1.03',
				104: '1.04',
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
				'35-percent': '35%',
				'40-percent': '40%',
				'50-percent': '50%',
				'75-percent': '75%',
			},
			marginTop: {
				0.25: '0.0625rem'
			}
		},
	},
	variants: {
		extend: {
			opacity: ['disabled'],
			cursor: ['disabled'],
			borderStyle: ['hover', 'focus'],
			borderRadius: ['hover'],
			borderWidth: ['hover'],
			borderColor: ['hover'],
			margin: ['last'],
			scale: ['hover'],
		},
	},
	plugins: [require('@tailwindcss/forms'), require('@tailwindcss/line-clamp')],
};

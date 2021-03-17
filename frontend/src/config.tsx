export const config = {
	general: {
		isDev: true,
		appName: 'Recommdo',
	},
	i18n: {
		defaultLocale: 'uk',
		locales: ['en', 'uk'],
	},
	api: {
		url: 'http://127.0.0.1:8080/gql',
		authTokenLocation: 'ut',
		refreshTokenLocation: 'rt',
	},
};

import '../../styles/globals.css';

import * as React from 'react';
import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { useApollo } from '../lib/apolloClient';
import { ApolloProvider } from '@apollo/client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';
import { checkUserTokens, getNewAccessToken, getUserToken, TOKEN_TYPES } from '../utils/userUtils';

function Application({ Component, pageProps }: AppProps) {
	const apolloClient = useApollo(pageProps.initialApolloState);

	const { route, push, locale, defaultLocale } = useRouter();

	const [userAuthorized, setUserAuthorized] = useState(false);

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			route != null &&
			route?.length > 0 &&
			(locale != null || defaultLocale != null)
		) {
			if (!checkUserTokens()) {
				const refreshToken = getUserToken(TOKEN_TYPES.REFRESH);
				const accessToken = getUserToken(TOKEN_TYPES.ACCESS);

				if (refreshToken == null && accessToken == null && route !== '/admin/login') {
					push('/admin/login', '/admin/login', { locale: locale ?? defaultLocale })
						.then(() => {
							setUserAuthorized(true);
						})
						.catch((e) => {
							console.error('Unable to open login page', e);
						});
				} else if (refreshToken != null && accessToken == null) {
					const newAccessToken = getNewAccessToken(apolloClient);

					if (newAccessToken == null && route !== '/admin/login') {
						push('/admin/login', '/admin/login', { locale: locale ?? defaultLocale })
							.then(() => {
								setUserAuthorized(true);
							})
							.catch((e) => {
								console.error('Unable to open login page', e);
							});
					} else {
						setUserAuthorized(true);
					}
				} else {
					setUserAuthorized(true);
				}
			} else {
				setUserAuthorized(true);
			}
		}
	}, [route, locale, defaultLocale]);

	return (
		<ApolloProvider client={apolloClient}>
			{userAuthorized ? (
				<Component {...pageProps} />
			) : (
				<Spinner size={56} overlayMode overlayColor="transparent" />
			)}
		</ApolloProvider>
	);
}

export default appWithTranslation(Application);

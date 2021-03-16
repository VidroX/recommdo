import '../../styles/globals.css';

import * as React from 'react';
import { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import { useApollo } from '../lib/apolloClient';
import { ApolloProvider } from '@apollo/client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { config } from '../config';
import Spinner from '../components/Spinner';
import Layout from '../components/Layout';

function Application({ Component, pageProps }: AppProps) {
	const apolloClient = useApollo(pageProps.initialApolloState);

	const { route, push, locale, defaultLocale } = useRouter();

	const [canceled, setCanceled] = useState(false);
	const [userAuthorized, setUserAuthorized] = useState(false);

	useEffect(() => {
		return () => {
			setCanceled(true);
		};
	}, []);

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			route != null &&
			route?.length > 0 &&
			(locale != null || defaultLocale != null)
		) {
			const token = localStorage?.getItem(config.api.authTokenLocation);
			if (token == null && route !== '/admin/login') {
				push('/admin/login', '/admin/login', { locale: locale ?? defaultLocale })
					.then(() => {
						!canceled && setUserAuthorized(true);
					})
					.catch((e) => {
						console.error('Unable to open login page', e);
					});
			} else {
				!canceled && setUserAuthorized(true);
			}
		}
	}, [route, locale, defaultLocale, canceled]);

	return (
		<ApolloProvider client={apolloClient}>
			{userAuthorized ? (
				route === '/admin/login' ? (
					<Component {...pageProps} />
				) : (
					<Layout showNavbar={true} showFooter={true}>
						<Component {...pageProps} />
					</Layout>
				)
			) : (
				<Spinner size={56} overlayMode overlayColor="transparent" />
			)}
		</ApolloProvider>
	);
}

export default appWithTranslation(Application);

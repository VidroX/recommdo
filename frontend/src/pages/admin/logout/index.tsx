import * as React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApolloClient } from '@apollo/client';
import { removeUserToken, TOKEN_TYPES } from '../../../utils/userUtils';

const LogoutPage = () => {
	const { route, push, locale, defaultLocale } = useRouter();
	const apolloClient = useApolloClient();

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			route != null &&
			route?.length > 0 &&
			(locale != null || defaultLocale != null)
		) {
			removeUserToken(TOKEN_TYPES.ALL);

			apolloClient.resetStore().finally(() => {
				push('/admin/login/', '/admin/login/', { locale: locale ?? defaultLocale }).catch((e) => {
					console.error('Unable to redirect to main page', e);
				});
			});
		}
	}, [route, locale, defaultLocale]);

	return <div>Logging out...</div>;
};

export default LogoutPage;

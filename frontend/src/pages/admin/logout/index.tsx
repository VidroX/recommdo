import * as React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useApolloClient } from '@apollo/client';
import { removeUserToken, TOKEN_TYPES } from '../../../utils/userUtils';
import Spinner from '../../../components/Spinner';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../config';
import { useTranslation } from 'next-i18next';

const LogoutPage = () => {
	const { route, push, locale, defaultLocale } = useRouter();
	const apolloClient = useApolloClient();

	const { t } = useTranslation('common');

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

	return <Spinner size={64} overlayColor="#FDFDFDFF" overlayMode description={t('loggingOut')} />;
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common'])),
	},
});

export default LogoutPage;

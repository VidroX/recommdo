import * as React from 'react';
import { config } from '../../../config';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../../../components/Layout';
import { useTranslation } from 'next-i18next';


const SettingsPage = () => {
	const { t } = useTranslation('settings');
	const { t: commonTranslate } = useTranslation('common');

	return (
		<Layout pageName={commonTranslate('settingsTitle')}>
			123
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'settings'])),
	},
});

export default SettingsPage;

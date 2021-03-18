import * as React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { config } from '../config';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';

const Home = () => {
	const { t } = useTranslation('common');

	return (
		<Layout>
			<div>
				<main>{t('test')}</main>
			</div>
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'auth'])),
	},
});

export default Home;

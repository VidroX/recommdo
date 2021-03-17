import * as React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { config } from '../config';
import { useTranslation } from 'next-i18next';

const Home = () => {
	const { t } = useTranslation('common');

	return (
		<div>
			<main>{t('test')}</main>
		</div>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common'])),
	},
});

export default Home;

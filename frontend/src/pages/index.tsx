import * as React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { config } from '../config';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';
import { BsPlusSquare } from 'react-icons/bs';
import Button from '../components/buttons/Button';

const Home = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');

	return (
		<Layout pageName={commonTranslate('projectsTitle')}>
			<div className="flex flex-1 justify-between items-center">
				<h1 className="text-primary font-bold">{commonTranslate('projectsTitle')}</h1>
				<Button title={t('addNewProject')} href="/projects/create">
					<BsPlusSquare size={20} className="md:mr-2" /> <span className="hidden md:flex">{t('addNewProject')}</span>
				</Button>
			</div>
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'projects'])),
	},
});

export default Home;

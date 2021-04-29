import * as React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { config } from '../config';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';
import { BsPlusSquare } from 'react-icons/bs';
import Button from '../components/buttons/Button';
import { useQuery } from '@apollo/client';
import { GET_PROJECTS_QUERY } from '../apollo/mutations/projects';
import Link from '../components/buttons/Link';
import useUser from '../hooks/useUser';

interface Project {
	id: string;
	name: string;
	analyzed: boolean;
	imported: boolean;
}

interface Projects {
	projects: Project[];
}

const buttonStyles = [
	'flex',
	'flex-1',
	'w-full',
	'h-32',
	'rounded',
	'bg-white',
	'flex-col',
	'shadow-md',
	'hover:shadow-xl',
	'focus:shadow-xl',
	'focus:outline-none',
	'active:shadow-none',
	'p-4',
	'transform',
	'hover:scale-102',
	'duration-200',
	'justify-center',
	'items-center',
	'font-semibold',
	'break-all',
	'overflow-hidden',
].join(' ');

const Home = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');
	const { loading, data } = useQuery<Projects>(GET_PROJECTS_QUERY, {
		fetchPolicy: 'network-only',
		pollInterval: 300000,
	});

	const user = useUser();

	const renderRows = () => {
		if (loading) {
			return (
				<>
					<div className="animate-pulse md:flex md:flex-1 flex-col md:flex-row justify-between mt-3 md:mt-5">
						<div className="flex flex-1 h-32 bg-gray-300 rounded mt-2 md:mt-0 md:mr-2" />
						<div className="flex flex-1 h-32 bg-gray-300 rounded mt-2 md:mt-0 md:mr-2" />
						<div className="flex flex-1 h-32 bg-gray-300 rounded mt-2 md:mt-0" />
					</div>
					<div className="animate-pulse md:flex md:flex-1 flex-col md:flex-row justify-between md:mt-5">
						<div className="flex flex-1 h-32 bg-gray-300 rounded mt-2 md:mt-0 md:mr-2" />
						<div className="flex flex-1 h-32 bg-gray-300 rounded mt-2 md:mt-0 md:mr-2" />
						<div className="flex flex-1 h-32 bg-gray-300 rounded mt-2 md:mt-0" />
					</div>
				</>
			);
		}

		const rows: Project[][] = [];

		if (data != null) {
			let count = 0,
				rowIndex = 0;

			for (const project of data.projects) {
				if (count <= 2) {
					if (rows[rowIndex] == null) {
						rows[rowIndex] = new Array(3).fill({
							id: '',
							name: '',
							analyzed: false,
							imported: false,
						});
					}
					rows[rowIndex][count] = project;
				}

				count++;
				if (count === 3) {
					count = 0;
					rowIndex++;
				}
			}
		}

		return (
			rows.map((obj, outerIndex) => (
				<div
					key={'project-rows-' + outerIndex}
					className="md:flex md:flex-1 flex-col md:flex-row justify-between md:mt-5">
					{obj.map((row, index) => (
						<div
							key={'project-rows-' + outerIndex + '-item-' + index}
							className="w-full mt-4 md:mt-0 md:mr-2 last:mr-0 justify-center items-center text-center">
							<Link href={'/projects/' + row.id + '/'}>
								<div className={buttonStyles + (row.id?.length > 0 ? '' : ' hidden')}>
									<p className="line-clamp-3">{row.name}</p>
									{!row.imported ? (
										<p className="font-light text-xs mt-1">{t('beingImported')}</p>
									) : (
										!row.analyzed && <p className="font-light text-xs mt-1">{t('beingAnalyzed')}</p>
									)}
								</div>
							</Link>
						</div>
					))}
				</div>
			)) ?? null
		);
	};

	return (
		<Layout pageName={commonTranslate('projectsTitle')}>
			<div className="flex flex-1 justify-between items-center">
				<h1 className="text-primary font-bold">{commonTranslate('projectsTitle')}</h1>
				{user?.accessLevel != null && user.accessLevel?.level > 1 && (
					<Button title={t('addNewProject')} href="/projects/create">
						<BsPlusSquare size={20} className="md:mr-2" />{' '}
						<span className="hidden md:flex">{t('addNewProject')}</span>
					</Button>
				)}
			</div>
			<div className="flex flex-1 flex-col">
				{data?.projects != null && data?.projects?.length < 1 && (
					<div className="mt-5 font-semibold">
						{user?.accessLevel != null && user.accessLevel?.level <= 1 && t('noProjectsAssigned')}
						{user?.accessLevel != null && user.accessLevel?.level > 1 && t('noProjectsCreated')}
					</div>
				)}
				{data?.projects != null && data?.projects?.length > 0 && renderRows()}
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

import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../../config';
import { useQuery } from '@apollo/client';
import { GET_PROJECT_QUERY } from '../../../../apollo/mutations/projects';
import { ProjectObject } from '../index';
import Link from '../../../../components/buttons/Link';

const ProjectSettings = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');
	const router = useRouter();
	const { pid } = router.query;

	const { loading, data, error } = useQuery<ProjectObject>(GET_PROJECT_QUERY, {
		fetchPolicy: 'network-only',
		variables: {
			projectId: pid,
		},
	});

	return (
		<Layout pageName={commonTranslate('projectSettings')}>
			<div className="flex flex-1 justify-between items-center flex-row">
				{(loading || error || data?.project?.name == null || data?.project?.name?.length <= 0) && (
					<div className="animate-pulse">
						<div className="h-6 w-64 bg-gray-300 rounded" />
					</div>
				)}
				{!loading && !error && data?.project?.name != null && data.project.name.length > 0 && (
					<div className="flex flex-row select-none w-full md:max-w-75-percent">
						<Link
							className="text-black font-light hover:text-primary overflow-ellipsis overflow-hidden whitespace-nowrap break-all"
							href="/">
							{commonTranslate('projectsTitle')}
						</Link>
						<span className="text-black font-light mx-2 cursor-default">/</span>
						<Link
							className="text-black font-light hover:text-primary overflow-ellipsis overflow-hidden whitespace-nowrap break-all"
							href={{ pathname: '/projects/[pid]/', query: { pid } }}>
							{data?.project.name}
						</Link>
						<div className="flex flex-1 w-full">
							<span className="text-black font-light mx-2 cursor-default">/</span>
							<h1 className="font-bold text-primary cursor-default overflow-ellipsis overflow-hidden whitespace-nowrap break-all w-full">
								{commonTranslate('projectSettings')}
							</h1>
						</div>
					</div>
				)}
			</div>
			<div className="flex flex-1 flex-col mt-6">{pid}</div>
		</Layout>
	);
};

export const getStaticPaths: GetStaticPaths<{ pid: string }> = async () => {
	return {
		paths: [],
		fallback: 'blocking',
	};
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'projects'])),
	},
});

export default ProjectSettings;

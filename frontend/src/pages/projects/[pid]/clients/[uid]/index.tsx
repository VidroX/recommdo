import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Layout from '../../../../../components/Layout';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../../../config';
import Link from '../../../../../components/buttons/Link';
import { useQuery } from '@apollo/client';
import { Metadata, ProjectObject } from '../../purchases';
import {
	GET_PROJECT_QUERY,
	GET_USER_PURCHASES_QUERY,
	GET_USER_RECOMMENDATIONS_QUERY,
} from '../../../../../apollo/mutations/projects';
import DataTable from 'react-data-table-component';
import { AiFillStar } from 'react-icons/ai';
import { useCallback } from 'react';

export interface UserRecommendation {
	id: string;
	userId: number;
	userItemWeight: number;
	score: number;
	metadata?: Metadata | null;
}

interface UserRecommendations {
	userRecommendations: UserRecommendation[];
}

export interface UserPurchase {
	id: string;
	userId: number;
	weight: number;
	metadata?: Metadata | null;
}

interface UserPurchases {
	userPurchases: UserPurchase[];
}

const ProjectUser = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');
	const router = useRouter();
	const { pid, uid } = router.query;

	const {
		loading: projectLoading,
		data: projectData,
		error: projectError,
	} = useQuery<ProjectObject>(GET_PROJECT_QUERY, {
		fetchPolicy: 'network-only',
		variables: {
			projectId: pid,
		},
	});

	const {
		loading: recommendationsLoading,
		data: recommendationsData,
		error: recommendationsError,
	} = useQuery<UserRecommendations>(GET_USER_RECOMMENDATIONS_QUERY, {
		fetchPolicy: 'network-only',
		variables: {
			projectId: pid,
			userId: uid,
		},
	});

	const {
		loading: purchasesLoading,
		data: purchasesData,
		error: purchasesError,
	} = useQuery<UserPurchases>(GET_USER_PURCHASES_QUERY, {
		fetchPolicy: 'network-only',
		variables: {
			projectId: pid,
			userId: uid,
		},
	});

	const purchasesColumns = [
		{
			name: t('item'),
			selector: 'purchaseId',
			cell: (row: UserPurchase) =>
				row.metadata?.name != null
					? row.metadata.name
					: t('notDefined') + ' (ID: ' + row.metadata?.metaId + ')',
			sortable: false,
		},
		{
			name: t('purchaseAmount'),
			selector: 'weight',
			sortable: true,
		},
	];

	const recommendationsColumns = [
		{
			name: t('item'),
			selector: 'itemId',
			cell: (row: UserRecommendation) =>
				row.metadata?.name != null ? row.metadata.name : t('notDefined'),
			sortable: false,
		},
		{
			name: t('recommendationSignificance'),
			selector: 'userItemWeight',
			sortable: true,
			cell: (row: UserRecommendation) => {
				const starsArr: number[] = [];

				for (let i = 1; i <= row.userItemWeight; i++) {
					starsArr.push(i);
				}

				let color = 'var(--color-primary)';
				switch (row.userItemWeight) {
					case 4:
						color = '#37dbad';
						break;
					case 3:
						color = '#F4E76E';
						break;
					case 2:
						color = '#FF8E72';
						break;
					case 1:
						color = '#ea4132';
						break;
				}

				return (
					<div className="flex flex-row justify-center items-center" style={{ color }}>
						{starsArr.map((_, index) => (
							<AiFillStar
								className={index < row.userItemWeight ? 'mr-1' : ''}
								size={14}
								key={row.id + '-star-' + index}
							/>
						))}
					</div>
				);
			},
		},
	];

	const generateSkeleton = useCallback((amount = 11, flex = false) => {
		const arr = new Array(amount).fill(undefined);

		return (
			<div className={'animate-pulse' + (flex ? ' flex flex-1 flex-col' : '')}>
				{arr.map((_, index) => (
					<div
						key={'skeleton-' + index}
						className={'w-full h-12 bg-gray-300 rounded' + (index != 0 ? ' mt-2' : '')}
					/>
				))}
			</div>
		);
	}, []);

	const onTableRowClick = (row: any) => {
		if (row?.metadata?.metaId != null && row?.metadata?.id != null) {
			router
				.push(
					'/projects/[pid]/item/[itemId]/',
					'/projects/' + pid + '/item/' + row?.metadata?.id + '/',
					{
						locale: router.locale ?? router.defaultLocale,
					}
				)
				.catch((e) => {
					config.general.isDev &&
						console.error('[Project Purchases]', 'Unable to redirect to user page', e);
				});
		}
	};

	const renderPurchases = () => {
		if (purchasesData?.userPurchases == null || purchasesData.userPurchases.length <= 0) {
			return generateSkeleton(10);
		}

		return (
			<div className="mb-6 leading-7">
				<h1 className="font-semibold text-primary mb-2">{t('userPurchases')}:</h1>
				<div className="shadow-md rounded bg-white">
					<DataTable
						noHeader
						onRowClicked={onTableRowClick}
						highlightOnHover
						columns={purchasesColumns}
						data={purchasesData.userPurchases}
						pagination
						paginationRowsPerPageOptions={[10, 15, 20]}
						paginationComponentOptions={{
							noRowsPerPage: true,
						}}
						customStyles={{
							pagination: {
								style: {
									backgroundColor: 'transparent',
								},
							},
							rows: {
								style: {
									cursor: 'pointer',
									userSelect: 'none',
								},
							},
						}}
					/>
				</div>
			</div>
		);
	};

	const renderRecommendations = () => {
		if (
			recommendationsData?.userRecommendations == null ||
			recommendationsData.userRecommendations.length <= 0
		) {
			return generateSkeleton(10);
		}

		return (
			<div className="leading-7">
				<h1 className="font-semibold text-primary mb-2">{t('userRecommendations')}:</h1>
				<div className="shadow-md rounded bg-white">
					<DataTable
						noHeader
						onRowClicked={onTableRowClick}
						highlightOnHover
						columns={recommendationsColumns}
						data={recommendationsData.userRecommendations}
						pagination
						paginationRowsPerPageOptions={[10, 15, 20]}
						paginationComponentOptions={{
							noRowsPerPage: true,
						}}
						customStyles={{
							pagination: {
								style: {
									backgroundColor: 'transparent',
								},
							},
							rows: {
								style: {
									cursor: 'pointer',
									userSelect: 'none',
								},
							},
						}}
					/>
				</div>
			</div>
		);
	};

	return (
		<Layout pageName={commonTranslate('user') + ' ' + uid}>
			<div className="flex flex-1 justify-between items-center flex-row">
				{(projectLoading ||
					projectError ||
					projectData?.project?.name == null ||
					projectData?.project?.name?.length <= 0) && (
					<div className="animate-pulse">
						<div className="h-6 w-64 bg-gray-300 rounded" />
					</div>
				)}
				{!projectLoading &&
					!projectError &&
					projectData?.project?.name != null &&
					projectData.project.name.length > 0 && (
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
								{projectData?.project.name}
							</Link>
							<div className="flex flex-1 w-full">
								<span className="text-black font-light mx-2 cursor-default">/</span>
								<h1 className="font-bold text-primary cursor-default overflow-ellipsis overflow-hidden whitespace-nowrap break-all w-full">
									{commonTranslate('user')} {uid}
								</h1>
							</div>
						</div>
					)}
			</div>
			<div className="flex flex-1 flex-col mt-6">
				{renderPurchases()}
				{renderRecommendations()}
			</div>
		</Layout>
	);
};

export const getStaticPaths: GetStaticPaths<{ uid: string; pid: string }> = async () => {
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

export default ProjectUser;

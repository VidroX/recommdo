import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../../config';
import { useQuery } from '@apollo/client';
import {
	GET_PROJECT_QUERY,
	GET_PROJECT_RECOMMENDATIONS_QUERY,
} from '../../../../apollo/mutations/projects';
import { Metadata, ProjectObject, Sort } from '../purchases';
import Link from '../../../../components/buttons/Link';
import { useCallback, useEffect, useState } from 'react';
import DataTable, { IDataTableColumn } from 'react-data-table-component';
import Spinner from '../../../../components/Spinner';
import Input from '../../../../components/inputs/Input';
import Button from '../../../../components/buttons/Button';
import { CgSearch } from 'react-icons/cg';
import { AiFillStar } from 'react-icons/ai';

export interface ProjectRecommendation {
	id: string;
	userId: number;
	userItemWeight: number;
	score: number;
	metadata?: Metadata | null;
}

interface ProjectRecommendations {
	projectRecommendations: {
		recommendations: ProjectRecommendation[];
		currentPage: number;
		pageAmount: number;
		showEntries: number;
		totalEntries: number;
	};
}

const ItemStarsPage = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');
	const router = useRouter();
	const { pid } = router.query;
	const slug: string[] =
		typeof router?.query?.slug != 'string' && router?.query?.slug != null ? router.query.slug : [];

	const itemId = slug[0] ?? 'all';
	const stars = slug[1] ?? null;

	const [localLoading, setLocalLoading] = useState(false);
	const [shouldPoll, setShouldPoll] = useState(true);
	const [searchVal, setSearchVal] = useState('');
	const [tablePage, setTablePage] = useState(1);
	const [sortOrder, setSortOrder] = useState('-userId');
	const [sortDirection, setSortDirection] = useState<Sort>({
		direction: 'desc',
		field: 'userId',
	});

	const {
		loading: projectLoading,
		data: projectData,
		error: projectError,
	} = useQuery<ProjectObject>(GET_PROJECT_QUERY, {
		fetchPolicy: 'network-only',
		pollInterval: shouldPoll ? 300000 : 0,
		variables: {
			projectId: pid,
		},
	});

	const { loading, data, error, refetch } = useQuery<ProjectRecommendations>(
		GET_PROJECT_RECOMMENDATIONS_QUERY,
		{
			skip: shouldPoll,
			fetchPolicy: 'network-only',
			pollInterval: shouldPoll ? 300000 : 0,
			variables: {
				projectId: pid,
				itemId,
				stars,
				page: tablePage,
				orderBy: sortOrder,
			},
		}
	);

	const columns = [
		{
			name: t('userId'),
			selector: 'userId',
			sortable: true,
		},
		{
			name: t('item'),
			selector: 'itemId',
			cell: (row: ProjectRecommendation) =>
				row.metadata?.name != null ? row.metadata.name : t('notDefined'),
			sortable: true,
		},
		{
			name: t('userWeight'),
			selector: 'userItemWeight',
			sortable: true,
			cell: (row: ProjectRecommendation) => {
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

	useEffect(() => {
		if (
			projectData?.project != null &&
			pid != null &&
			projectData.project.analyzed &&
			projectData.project.imported
		) {
			setShouldPoll(false);
		}
	}, [pid, projectData]);

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

	const onTablePageChange = (page: number, rowsPerPage: number) => {
		setLocalLoading(true);
		setTablePage(page);
		refetch({
			page,
			itemId,
			stars,
			orderBy: sortOrder ?? undefined,
			search: searchVal?.length > 0 ? searchVal : undefined,
		})?.finally(() => {
			setLocalLoading(false);
		});
	};

	const onTableSort = (
		column: IDataTableColumn<ProjectRecommendation>,
		sortDir: 'asc' | 'desc'
	) => {
		setLocalLoading(true);

		const selector = column.selector === 'metadata.name' ? 'itemId' : column.selector;
		const localSortOrder = (sortDir === 'asc' ? '' : '-') + selector;

		setSortOrder(localSortOrder);
		if (typeof column.selector === 'string') {
			setSortDirection({
				direction: sortDir,
				field: column.selector,
			});
		} else {
			setSortDirection({
				direction: sortDir,
				field: 'userId',
			});
		}

		if (searchVal != null && searchVal.length > 0) {
			refetch({ page: 1, search: searchVal, itemId, stars, orderBy: localSortOrder }).finally(
				() => {
					setLocalLoading(false);
				}
			);
		} else {
			refetch({ page: 1, orderBy: localSortOrder, itemId, stars, search: undefined }).finally(
				() => {
					setLocalLoading(false);
				}
			);
		}
	};

	const initiateSearch = () => {
		if (searchVal != null) {
			setLocalLoading(true);
			if (searchVal.length > 0) {
				refetch({ page: 1, search: searchVal, itemId, stars, orderBy: sortOrder })?.finally(() => {
					setLocalLoading(false);
				});
			} else {
				refetch({ page: 1, orderBy: sortOrder, itemId, stars, search: undefined })?.finally(() => {
					setLocalLoading(false);
				});
			}
		}
	};

	const onTableRowClick = (row: any) => {
		if (row?.userId != null) {
			router
				.push(
					'/projects/[pid]/clients/[uid]/',
					'/projects/' + pid + '/clients/' + row.userId + '/',
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

	return (
		<Layout pageName={projectData?.project?.name + ' ' + t('statistics')}>
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
									{t('statistics')}
								</h1>
							</div>
						</div>
					)}
			</div>
			<div className="flex flex-1 flex-col mt-6">
				{error && !loading && t('dataNotFound')}
				{!projectError && !projectLoading ? (
					!projectData?.project.imported ? (
						<div className="flex flex-1 flex-col justify-center items-center my-8">
							<Spinner spinnerColor="#02C2A8" size={48} description={t('beingImported')} />
						</div>
					) : (
						!projectData.project.analyzed && (
							<div className="flex flex-1 flex-col justify-center items-center my-8">
								<Spinner spinnerColor="#02C2A8" size={48} description={t('beingAnalyzed')} />
							</div>
						)
					)
				) : (
					<p className="font-semibold justify-center items-center flex flex-1 text-center">
						{commonTranslate('generalError')}
					</p>
				)}
				{data?.projectRecommendations == null ||
				loading ||
				localLoading ||
				!projectData?.project.imported ||
				!projectData?.project.analyzed ? (
					!error &&
					projectData?.project.imported &&
					projectData?.project.analyzed &&
					generateSkeleton()
				) : (
					<div className="rounded shadow-md bg-white">
						<div className="flex mb-2">
							<Input
								type="number"
								id="search"
								name="search"
								className="w-full md:max-w-sm"
								inputClassName="rounded-tl"
								rounded={false}
								placeholder={commonTranslate('search')}
								onChange={(e) => {
									setSearchVal(e.target.value);
								}}
								min={0}
								value={searchVal}
							/>
							<Button
								title={commonTranslate('search')}
								rounded={false}
								onClick={initiateSearch}
								extraClasses="rounded-r">
								<CgSearch size={20} />
							</Button>
						</div>
						<DataTable
							noHeader
							onRowClicked={onTableRowClick}
							paginationServer
							highlightOnHover
							columns={columns}
							progressPending={loading || localLoading}
							data={data.projectRecommendations.recommendations}
							paginationTotalRows={data.projectRecommendations.totalEntries}
							pagination
							sortServer
							defaultSortAsc={sortDirection.direction === 'asc'}
							defaultSortField={sortDirection.field}
							onChangePage={onTablePageChange}
							paginationDefaultPage={tablePage}
							paginationRowsPerPageOptions={[10]}
							progressComponent={generateSkeleton(10, true)}
							paginationComponentOptions={{
								noRowsPerPage: true,
							}}
							onSort={onTableSort}
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
				)}
			</div>
		</Layout>
	);
};

export const getStaticPaths: GetStaticPaths<{ pid: string; slug: string[] }> = async () => {
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

export default ItemStarsPage;

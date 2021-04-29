import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import Layout from '../../../components/Layout';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../config';
import { useRouter } from 'next/router';
import { GET_PROJECT_PURCHASES_QUERY, GET_PROJECT_QUERY } from '../../../apollo/mutations/projects';
import { useCallback, useEffect, useState } from 'react';
import DataTable, { IDataTableColumn } from 'react-data-table-component';
import Spinner from '../../../components/Spinner';
import Input from '../../../components/inputs/Input';
import Button from '../../../components/buttons/Button';
import { CgSearch } from 'react-icons/cg';
import { RiSettings4Fill } from 'react-icons/ri';
import Link from '../../../components/buttons/Link';

export interface ProjectObject {
	project: {
		id: string;
		name: string;
		analyzed: boolean;
		imported: boolean;
	};
}

export interface Metadata {
	id: string;
	metaId: number;
	name: string;
}

export interface ProjectPurchase {
	id: string;
	userId: number;
	weight: number;
	metadata?: Metadata | null;
}

interface ProjectPurchases {
	projectPurchases: {
		purchases: ProjectPurchase[];
		currentPage: number;
		pageAmount: number;
		showEntries: number;
		totalEntries: number;
	};
}

interface Sort {
	direction: string;
	field: string;
}

const Project = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');
	const router = useRouter();
	const { pid } = router.query;

	const [localLoading, setLocalLoading] = useState(false);
	const [shouldPoll, setShouldPoll] = useState(true);
	const [searchVal, setSearchVal] = useState('');
	const [tablePage, setTablePage] = useState(1);
	const [sortOrder, setSortOrder] = useState('-userId');
	const [sortDirection, setSortDirection] = useState<Sort>({
		direction: 'desc',
		field: 'userId',
	});

	const { loading, data, error } = useQuery<ProjectObject>(GET_PROJECT_QUERY, {
		fetchPolicy: 'network-only',
		pollInterval: shouldPoll ? 300000 : 0,
		variables: {
			projectId: pid,
		},
	});

	const {
		loading: purchaseLoading,
		data: purchaseData,
		error: purchaseError,
		refetch,
	} = useQuery<ProjectPurchases>(GET_PROJECT_PURCHASES_QUERY, {
		skip: shouldPoll,
		fetchPolicy: 'network-only',
		pollInterval: shouldPoll ? 300000 : 0,
		variables: {
			projectId: pid,
			page: tablePage,
			orderBy: sortOrder,
		},
	});

	const columns = [
		{
			name: t('userId'),
			selector: 'userId',
			sortable: true,
		},
		{
			name: t('item'),
			selector: 'purchaseId',
			cell: (row: ProjectPurchase) =>
				row.metadata?.name != null ? row.metadata.name : t('notDefined'),
			sortable: true,
		},
		{
			name: t('purchaseAmount'),
			selector: 'weight',
			sortable: true,
		},
	];

	useEffect(() => {
		if (data?.project != null && pid != null && data.project.analyzed && data.project.imported) {
			setShouldPoll(false);
		}
	}, [pid, data]);

	const onTablePageChange = (page: number, rowsPerPage: number) => {
		setLocalLoading(true);
		setTablePage(page);
		refetch({
			page,
			orderBy: sortOrder ?? undefined,
			search: searchVal?.length > 0 ? searchVal : undefined,
		})?.finally(() => {
			setLocalLoading(false);
		});
	};

	const onTableSort = (column: IDataTableColumn<ProjectPurchase>, sortDir: 'asc' | 'desc') => {
		setLocalLoading(true);

		const selector = column.selector === 'metadata.name' ? 'purchaseId' : column.selector;
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
			refetch({ page: 1, search: searchVal, orderBy: localSortOrder }).finally(() => {
				setLocalLoading(false);
			});
		} else {
			refetch({ page: 1, orderBy: localSortOrder, search: undefined }).finally(() => {
				setLocalLoading(false);
			});
		}
	};

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

	const initiateSearch = () => {
		if (searchVal != null) {
			setLocalLoading(true);
			if (searchVal.length > 0) {
				refetch({ page: 1, search: searchVal, orderBy: sortOrder })?.finally(() => {
					setLocalLoading(false);
				});
			} else {
				refetch({ page: 1, orderBy: sortOrder, search: undefined })?.finally(() => {
					setLocalLoading(false);
				});
			}
		}
	};

	const onTableRowClick = (row: any) => {
		if (row?.userId != null) {
			router
				.push('/projects/[pid]/[uid]/', '/projects/' + pid + '/' + row.userId + '/', {
					locale: router.locale ?? router.defaultLocale,
				})
				.catch((e) => {
					console.error('Unable to redirect to user page', e);
				});
		}
	};

	return (
		<Layout pageName={data?.project.name ? data.project.name : commonTranslate('projectsTitle')}>
			<div className="flex flex-1 justify-between items-center">
				{data?.project.name && !error && !purchaseError && !loading ? (
					<>
						<div className="flex flex-row select-none w-full md:max-w-75-percent">
							<Link
								className="text-black font-light hover:text-primary overflow-ellipsis overflow-hidden whitespace-nowrap break-all"
								href="/">
								{commonTranslate('projectsTitle')}
							</Link>
							<div className="flex flex-1 w-0 md:w-full">
								<span className="text-black font-light mx-2 cursor-default">/</span>
								<h1 className="font-bold text-primary cursor-default overflow-ellipsis overflow-hidden whitespace-nowrap break-all w-full md:w-72">
									{data?.project.name}
								</h1>
							</div>
						</div>
						{!error && !purchaseError && data?.project.analyzed && data?.project.imported && (
							<Button
								title={commonTranslate('settingsTitle')}
								href={{ pathname: '/projects/[pid]/settings', query: { pid } }}>
								<RiSettings4Fill size={20} className="md:mr-2" />{' '}
								<span className="hidden md:flex">{commonTranslate('settingsTitle')}</span>
							</Button>
						)}
					</>
				) : (
					!error &&
					!purchaseError && (
						<div className="animate-pulse">
							<div className="h-6 w-64 bg-gray-300 rounded" />
						</div>
					)
				)}
			</div>
			<div className="flex flex-1 flex-col mt-6">
				{purchaseError && t('dataNotFound')}
				{!error ? (
					!data?.project.imported ? (
						<div className="flex flex-1 flex-col justify-center items-center my-8">
							<Spinner spinnerColor="#02C2A8" size={48} description={t('beingImported')} />
						</div>
					) : (
						!data.project.analyzed && (
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
				{purchaseData?.projectPurchases == null ||
				purchaseLoading ||
				localLoading ||
				!data?.project.imported ||
				!data?.project.analyzed ? (
					!purchaseError && data?.project.imported && data?.project.analyzed && generateSkeleton()
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
							progressPending={purchaseLoading || localLoading}
							data={purchaseData.projectPurchases.purchases}
							paginationTotalRows={purchaseData.projectPurchases.totalEntries}
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

export default Project;

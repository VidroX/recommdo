import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import Layout from '../../../components/Layout';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../config';
import { useRouter } from 'next/router';
import {
	GET_PROJECT_METADATA_QUERY,
	GET_PROJECT_QUERY,
	GET_PROJECT_STATISTICS_QUERY,
} from '../../../apollo/queries/projects';
import { useMemo, useState } from 'react';
import Button from '../../../components/buttons/Button';
import { RiSettings4Fill } from 'react-icons/ri';
import { FaShoppingBasket } from 'react-icons/fa';
import Link from '../../../components/buttons/Link';
import { InnerProjectObject, ProjectObject } from './purchases';
import StatisticsGraph, { NivoPieDataOption } from '../../../components/graphs/StatisticsGraph';
import SelectBox from '../../../components/inputs/SelectBox';
import Spinner from '../../../components/Spinner';
import useUser from '../../../hooks/useUser';

export interface InnerStatistic {
	stars: number;
	count: number;
	percentage: number;
}

interface ProjectStatistics {
	projectStatistics: {
		statistics: InnerStatistic[];
		metadata?: Metadata | null;
		project: InnerProjectObject;
	};
}

interface Metadata {
	id: string;
	name?: string | null;
	metaId: number;
}

interface ProjectMetadata {
	allMetadata: Metadata[];
}

interface Option {
	value: string;
	label: string;
	id: number | null;
	objectId: string | null;
}

const Project = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');
	const router = useRouter();
	const { pid } = router.query;

	const user = useUser();

	const [selectedOption, setSelectedOption] = useState<Option>({
		label: t('allItems'),
		value: 'all',
		id: null,
		objectId: null,
	});
	const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
	const [selectedItemObjectId, setSelectedItemObjectId] = useState<string | null>(null);
	const [generatedItems, setGeneratedItems] = useState<NivoPieDataOption[]>([]);

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

	const { loading, data, error } = useQuery<ProjectStatistics>(GET_PROJECT_STATISTICS_QUERY, {
		variables: {
			projectId: pid,
			itemId: selectedItemId,
		},
	});

	const {
		loading: metadataLoading,
		data: metadata,
		error: metadataError,
	} = useQuery<ProjectMetadata>(GET_PROJECT_METADATA_QUERY, {
		variables: {
			projectId: pid,
		},
	});

	const options = useMemo(() => {
		if (metadata?.allMetadata == null || metadata.allMetadata.length <= 0) {
			return [
				{
					label: t('allItems'),
					value: 'all',
					id: null,
				},
			];
		}

		const items: Option[] = [
			{
				label: t('allItems'),
				value: 'all',
				id: null,
				objectId: null,
			},
		];

		for (const obj of metadata.allMetadata) {
			items.push({
				label: obj.name ?? obj.metaId.toString(),
				value: obj.metaId.toString(),
				id: obj.metaId,
				objectId: obj.id,
			});
		}

		return items;
	}, [metadata?.allMetadata]);

	const onGraphItemClick = (item: NivoPieDataOption) => {
		if (item != null) {
			router
				.push(
					'/projects/[pid]/item/[itemId]/[starsAmount]/',
					'/projects/' +
						pid +
						'/item/' +
						(selectedItemObjectId ? selectedItemObjectId : 'all') +
						'/' +
						item.stars,
					{
						locale: router.locale ?? router.defaultLocale,
					}
				)
				.catch((e) => {
					config.general.isDev &&
						console.error('[Project Dashboard]', 'Unable to redirect to item stars page', e);
				});
		}
	};

	const onItemsGenerated = (items: NivoPieDataOption[]) => {
		setGeneratedItems(items);
	};

	return (
		<Layout
			pageName={
				!projectError && !projectLoading && projectData?.project?.name
					? projectData.project.name
					: t('projectDashboard')
			}>
			<div className="flex flex-1 justify-between items-center">
				{!projectError && !projectLoading && projectData?.project?.name ? (
					<div className="flex flex-1 flex-col md:flex-row md:justify-between">
						<div className="flex flex-row select-none w-full md:max-w-50-percent mb-2 md:mb-0">
							<Link
								className="text-black font-light hover:text-primary overflow-ellipsis overflow-hidden whitespace-nowrap break-all"
								href="/">
								{commonTranslate('projectsTitle')}
							</Link>
							<div className="flex flex-1 w-0 md:w-full">
								<span className="text-black font-light mx-2 cursor-default">/</span>
								<h1 className="font-bold text-primary cursor-default overflow-ellipsis overflow-hidden whitespace-nowrap break-all w-full md:w-72">
									{projectData.project.name}
								</h1>
							</div>
						</div>
						{!error && projectData?.project.analyzed && projectData?.project.imported && (
							<div className="flex flex-row">
								{user?.accessLevel?.isStaff && (
									<Button
										outlined
										extraClasses="mr-2"
										title={commonTranslate('settingsTitle')}
										href={{ pathname: '/projects/[pid]/settings', query: { pid } }}>
										<RiSettings4Fill size={18} className="mt-0 md:mt-0.5" />
									</Button>
								)}
								<Button
									title={t('allClientPurchases')}
									href={{ pathname: '/projects/[pid]/purchases', query: { pid } }}>
									<FaShoppingBasket size={18} className="mt-0.5 md:mt-0 md:mr-2" />{' '}
									<span className="hidden md:flex text-sm md:mt-0.5">
										{t('allClientPurchases')}
									</span>
								</Button>
							</div>
						)}
					</div>
				) : (
					!error && (
						<div className="animate-pulse">
							<div className="h-6 w-64 bg-gray-300 rounded" />
						</div>
					)
				)}
			</div>
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
			{!projectError &&
				!projectLoading &&
				projectData?.project.analyzed &&
				projectData?.project.imported && (
					<div className="flex flex-1 flex-col mt-6">
						<div className="flex flex-1">
							<div className="flex flex-1 flex-col-reverse md:flex-row">
								<div
									className={[
										'flex',
										'flex-col',
										'flex-1',
										'justify-center',
										'leading-6',
										'md:leading-8',
										'md:items-start',
									].join(' ')}>
									<div className="min-w-full md:min-w-50-percent">
										{!error && !metadataError && (loading || metadataLoading) ? (
											<div className="animate-pulse mb-4">
												<div className="h-12 w-full md:w-72 bg-gray-300 rounded" />
											</div>
										) : (
											<SelectBox
												id={'items-list'}
												name={'items-list'}
												label={t('item')}
												className={'mb-4'}
												options={options}
												value={selectedOption ?? undefined}
												onChange={(value: Option) => {
													setSelectedOption(value);
													setSelectedItemId(value.id);
													setSelectedItemObjectId(value.objectId);
												}}
											/>
										)}
										{!error && !metadataError && (loading || metadataLoading) ? (
											<div className="animate-pulse">
												<div className="h-64 w-full md:w-72 bg-gray-300 rounded" />
											</div>
										) : (
											generatedItems.map((item, index) => (
												<div
													className="flex flex-col md:flex-row items-start md:items-center mb-2 md:mb-0"
													key={'item-' + index}>
													<div className="flex flex-row items-center">
														<div
															style={{ width: 14, height: 14, backgroundColor: item.color }}
															className="rounded mr-2"
														/>
														<span className="mr-2 font-light">{item.id}</span>
													</div>
													<Link
														className="text-primary hover:text-primary-dark"
														href={{
															pathname: '/projects/[pid]/item/[itemId]/[starsAmount]/',
															query: {
																pid,
																itemId: selectedItemObjectId ? selectedItemObjectId : 'all',
																starsAmount: item.stars,
															},
														}}>
														{item.value} {t('clients')}
													</Link>
												</div>
											))
										)}
									</div>
								</div>
								<div className="flex flex-1 items-center z-50">
									{!error && !metadataError && (loading || metadataLoading) ? (
										<div
											className="animate-pulse flex flex-1 justify-center items-center"
											style={{ height: 500 }}>
											<div
												className="w-full bg-gray-300 rounded ml-0 md:ml-24"
												style={{ height: 350 }}
											/>
										</div>
									) : (
										<StatisticsGraph
											onItemsGenerated={onItemsGenerated}
											statistics={data?.projectStatistics.statistics}
											onGraphItemClick={onGraphItemClick}
										/>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
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

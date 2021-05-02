import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../../config';
import { useMutation, useQuery } from '@apollo/client';
import {
	GET_PROJECT_QUERY,
	GET_USERS_LIST_QUERY,
	UPDATE_PROJECT_ALLOWED_USERS_MUTATION,
} from '../../../../apollo/mutations/projects';
import Link from '../../../../components/buttons/Link';
import useUser, { User } from '../../../../hooks/useUser';
import Spinner from '../../../../components/Spinner';
import SelectBox from '../../../../components/inputs/SelectBox';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../../../components/buttons/Button';

interface UsersList {
	users: User[];
}

interface Option {
	value: string;
	label: string;
}

interface InnerProjectObject {
	id: string;
	name: string;
	analyzed: boolean;
	imported: boolean;
	allowedUsers: User[];
}

interface ProjectObject {
	project: InnerProjectObject;
}

const ProjectSettings = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');
	const router = useRouter();
	const { pid } = router.query;

	const user = useUser();

	const [localLoading, setLocalLoading] = useState(false);
	const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

	const [updateProjectAllowedUsers] = useMutation(UPDATE_PROJECT_ALLOWED_USERS_MUTATION, {
		variables: {
			projectId: pid,
			users: selectedUsers,
		},
	});

	const { loading, data, error } = useQuery<ProjectObject>(GET_PROJECT_QUERY, {
		fetchPolicy: 'network-only',
		variables: {
			projectId: pid,
		},
	});

	const { loading: usersLoading, data: usersData, error: usersError } = useQuery<UsersList>(
		GET_USERS_LIST_QUERY,
		{
			variables: {
				projectId: pid,
				skipAdmins: true,
			},
		}
	);

	const selectOptions: Option[] = useMemo(() => {
		if (usersData?.users == null || usersData.users.length <= 0) {
			return [];
		}

		const userOptions: Option[] = [];
		for (const user of usersData.users) {
			userOptions.push({
				label: user.firstName + ' ' + user.middleName + ' ' + user.lastName,
				value: user.id,
			});
		}

		return userOptions;
	}, [usersData?.users]);

	const defaultUsers = useMemo(() => {
		if (
			usersData?.users == null ||
			(usersData.users.length <= 0 && data != null && data.project.allowedUsers != null)
		) {
			return [];
		}

		const userOptions: Option[] = [];
		for (const user of usersData.users) {
			const userAllowed =
				data != null &&
				data.project.allowedUsers != null &&
				data.project.allowedUsers.findIndex((obj) => obj.id === user.id) > -1;
			if (userAllowed) {
				userOptions.push({
					label: user.firstName + ' ' + user.middleName + ' ' + user.lastName,
					value: user.id,
				});
			}
		}

		return userOptions;
	}, [selectOptions, data]);

	useEffect(() => {
		if (defaultUsers != null && defaultUsers?.length > 0) {
			const usersIds = [];

			for (const value of defaultUsers) {
				if (value.value != null) {
					usersIds.push(value.value);
				}
			}

			setSelectedUsers(usersIds);
		}
	}, [defaultUsers]);

	const updateUsers = async () => {
		setLocalLoading(true);
		try {
			await updateProjectAllowedUsers();
		} catch (e) {
			config.general.isDev && console.log('[Project Settings]', e);
		}

		router
			.push('/projects/[pid]/', '/projects/' + pid + '/', {
				locale: router.locale ?? router.defaultLocale,
			})
			.catch((e) => {
				config.general.isDev &&
					console.error('[Project Settings]', 'Unable to redirect to project page', e);
			}).finally(() => {
				setLocalLoading(false);
			});
	};

	const renderContent = () => {
		if (error || loading || usersError || usersLoading || defaultUsers == null) {
			return (
				<div className="animate-pulse">
					<div className="h-12 w-72 bg-gray-300 rounded" />
				</div>
			);
		}

		return (
			<div className="flex flex-col">
				<SelectBox
					isMulti
					id={'users-list'}
					name={'users-list'}
					label={t('addUserToProject')}
					className={'mb-4'}
					options={selectOptions}
					defaultValue={defaultUsers}
					onChange={(values: Option[]) => {
						const usersIds = [];

						for (const value of values) {
							if (value.value != null) {
								usersIds.push(value.value);
							}
						}

						setSelectedOptions(values);
						setSelectedUsers(usersIds);
					}}
				/>
				<div className="flex flex-row items-center justify-end">
					<Button onClick={updateUsers} loading={localLoading}>
						{commonTranslate('save')}
					</Button>
				</div>
			</div>
		);
	};

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
			<div className="flex flex-1 flex-col mt-6">
				{!user?.accessLevel?.isStaff && commonTranslate('notEnoughPermissions')}
				{!error && !loading && user?.accessLevel?.isStaff ? (
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
				{!error && !loading && user?.accessLevel?.isStaff && renderContent()}
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

export default ProjectSettings;

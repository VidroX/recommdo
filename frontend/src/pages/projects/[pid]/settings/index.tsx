import * as React from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Layout from '../../../../components/Layout';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../../config';
import { useMutation, useQuery } from '@apollo/client';
import {
	DELETE_PROJECT_MUTATION,
	GET_PROJECT_QUERY,
	GET_USERS_LIST_QUERY,
	UPDATE_PROJECT_ALLOWED_USERS_MUTATION,
	UPDATE_PROJECT_NAME_MUTATION,
} from '../../../../apollo/mutations/projects';
import Link from '../../../../components/buttons/Link';
import useUser, { User } from '../../../../hooks/useUser';
import Spinner from '../../../../components/Spinner';
import SelectBox from '../../../../components/inputs/SelectBox';
import { useEffect, useMemo, useState } from 'react';
import Button from '../../../../components/buttons/Button';
import Input from '../../../../components/inputs/Input';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { AiFillDelete } from 'react-icons/ai';
import { FaSave } from 'react-icons/fa';
import { MdCheck, MdClose } from 'react-icons/md';
import Modal from '../../../../components/Modal';

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

interface UpdateProjectFormValues {
	projectName: string;
}

interface UpdateProjectNameMutation {
	projectId: string;
	projectName: string;
}

const ProjectSettings = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');
	const router = useRouter();
	const { pid } = router.query;

	const user = useUser();

	const [deleteLoading, setDeleteLoading] = useState(false);
	const [modalShown, setModalShown] = useState(false);
	const [localLoading, setLocalLoading] = useState(false);
	const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);
	const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
	const [defaultProjectName, setDefaultProjectName] = useState<string | null>(null);

	const [apiDeleteProject] = useMutation(DELETE_PROJECT_MUTATION);

	const [updateProjectAllowedUsers] = useMutation(UPDATE_PROJECT_ALLOWED_USERS_MUTATION, {
		variables: {
			projectId: pid,
			users: selectedUsers,
		},
	});

	const [updateProjectName] = useMutation<UpdateProjectNameMutation>(UPDATE_PROJECT_NAME_MUTATION, {
		variables: {
			projectId: pid,
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

	const onModalClose = () => {
		setModalShown(false);
	};

	const onModalConfirm = () => {
		deleteProject().finally(() => {
			setModalShown(false);
		});
	};

	useEffect(() => {
		if (data?.project != null && data.project.name != null && data.project.name.length > 0) {
			setDefaultProjectName(data.project.name);
		} else if (data?.project != null && !loading) {
			setDefaultProjectName('');
		}
	}, [data?.project, loading]);

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

	const submitForm = async (
		values: UpdateProjectFormValues,
		{ setSubmitting }: FormikHelpers<UpdateProjectFormValues>
	) => {
		let success = false;

		try {
			await updateProjectName({
				variables: {
					projectId: pid,
					name: values.projectName,
				},
			});
			await updateProjectAllowedUsers();
			success = true;
		} catch (e) {
			config.general.isDev && console.log('[Project Settings]', e);
		}

		setSubmitting(false);

		if (success) {
			router
				.push('/projects/[pid]/', '/projects/' + pid + '/', {
					locale: router.locale ?? router.defaultLocale,
				})
				.catch((e) => {
					config.general.isDev &&
						console.error('[Project Settings]', 'Unable to redirect to project page', e);
				})
				.finally(() => {
					setLocalLoading(false);
				});
		}
	};

	const UpdateProjectSchema = Yup.object().shape({
		projectName: Yup.string()
			.min(4, t('smallProjectName'))
			.required(commonTranslate('requiredField')),
	});

	const deleteProject = async () => {
		setDeleteLoading(true);

		let success = false;

		try {
			await apiDeleteProject({
				variables: {
					projectId: pid,
				}
			});

			success = true;
		} catch (e) {
			config.general.isDev && console.log('[Project Settings]', e);
		}

		if (success) {
			router
				.push('/', '/', {
					locale: router.locale ?? router.defaultLocale,
				})
				.catch((e) => {
					config.general.isDev &&
					console.error('[Project Settings]', 'Unable to redirect to main page', e);
				})
				.finally(() => {
					setDeleteLoading(false);
				});
		}
	};

	const renderContent = () => {
		if (
			error ||
			loading ||
			usersError ||
			usersLoading ||
			defaultUsers == null ||
			defaultProjectName == null
		) {
			return (
				<div className="animate-pulse">
					<div className="h-12 w-72 bg-gray-300 rounded" />
				</div>
			);
		}

		return (
			<div className="flex flex-col">
				<Formik
					initialValues={{ projectName: defaultProjectName }}
					validationSchema={UpdateProjectSchema}
					onSubmit={submitForm}>
					{({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
						<form onSubmit={handleSubmit}>
							<Input
								id="projectName"
								name="projectName"
								label={t('projectName')}
								className="mb-4"
								placeholder="Example Project Name"
								onChange={handleChange}
								onBlur={handleBlur}
								value={values.projectName}
								error={errors.projectName && touched.projectName ? errors.projectName : null}
							/>
							<SelectBox
								isMulti
								id={'users-list'}
								name={'users-list'}
								label={t('projectUsers')}
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
							<div className="mt-2 flex flex-row items-center justify-end">
								<Button
									submitButton
									title={commonTranslate('save')}
									loading={isSubmitting}
									disabled={isSubmitting}>
									{!isSubmitting && <FaSave size={18} className="mr-2" />}{' '}
									<span className="flex">{commonTranslate('save')}</span>
								</Button>
							</div>
						</form>
					)}
				</Formik>
			</div>
		);
	};

	return (
		<Layout pageName={commonTranslate('projectSettings')}>
			<Modal
				isShown={modalShown}
				title={commonTranslate('confirmation')}
				onConfirm={onModalConfirm}
				onClose={onModalClose}
				buttons={[
					{
						dense: true,
						type: 'cancel',
						outlined: true,
						icon: <MdClose size={18} className="mr-2" />,
						buttonStyle: 'primary',
						title: commonTranslate('cancel'),
					},
					{
						dense: true,
						type: 'confirm',
						icon: <MdCheck size={18} className="mr-2" />,
						buttonStyle: 'danger',
						loading: deleteLoading,
						disabled: deleteLoading,
						title: commonTranslate('delete'),
					},
				]}>
				<p className="font-light text-center">{t('deleteConfirmation')}</p>
			</Modal>
			<div className="flex flex-1 justify-between items-center flex-row">
				{(loading || error || data?.project?.name == null || data?.project?.name?.length <= 0) && (
					<div className="animate-pulse">
						<div className="h-6 w-64 bg-gray-300 rounded" />
					</div>
				)}
				{!loading && !error && data?.project?.name != null && data.project.name.length > 0 && (
					<div className="flex flex-1 flex-col md:flex-row md:justify-between">
						<div className="flex flex-row select-none w-full md:max-w-50-percent mb-2 md:mb-0">
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
							<div className="flex flex-1 w-0 md:w-full">
								<span className="text-black font-light mx-2 cursor-default">/</span>
								<h1 className="font-bold text-primary cursor-default overflow-ellipsis overflow-hidden whitespace-nowrap break-all w-full">
									{commonTranslate('projectSettings')}
								</h1>
							</div>
						</div>
						<div className="flex flex-row">
							<Button
								buttonType="danger"
								title={commonTranslate('save')}
								onClick={() => setModalShown(true)}>
								<AiFillDelete size={18} className="md:mr-2" />{' '}
								<span className="hidden md:flex">{t('deleteProject')}</span>
							</Button>
						</div>
					</div>
				)}
			</div>
			<div className="flex flex-1 flex-col mt-6">
				{!error &&
					!loading &&
					!user?.accessLevel?.isStaff &&
					commonTranslate('notEnoughPermissions')}
				{!error ? (
					!loading && user?.accessLevel?.isStaff && !data?.project.imported ? (
						<div className="flex flex-1 flex-col justify-center items-center my-8">
							<Spinner spinnerColor="#02C2A8" size={48} description={t('beingImported')} />
						</div>
					) : (
						!loading &&
						user?.accessLevel?.isStaff &&
						!data?.project.analyzed && (
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

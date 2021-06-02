import * as React from 'react';
import { useTranslation } from 'next-i18next';
import useUser, { User } from '../../../hooks/useUser';
import Layout from '../../../components/Layout';
import { GetStaticPaths, GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../config';
import { useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import Link from '../../../components/buttons/Link';
import { GET_USER_QUERY } from '../../../apollo/queries/user';
import { AiFillDelete } from 'react-icons/ai';
import Button from '../../../components/buttons/Button';
import { useState } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { MdCheck, MdClose } from 'react-icons/md';
import Modal from '../../../components/Modal';
import { REMOVE_USER_MUTATION } from '../../../apollo/mutations/user';

interface UserQuery {
	user: User;
}

const UserInfo = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('users');

	const router = useRouter();
	const { uid } = router.query;

	const user = useUser();

	const [modalShown, setModalShown] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);

	const [removeUser] = useMutation(REMOVE_USER_MUTATION);

	const { loading, data, error } = useQuery<UserQuery>(GET_USER_QUERY, {
		variables: {
			userId: uid,
		},
	});

	const deleteUser = async () => {
		setDeleteLoading(true);

		let success = false;

		try {
			await removeUser({
				variables: {
					userId: uid,
				},
			});

			success = true;
		} catch (e) {
			config.general.isDev && console.log('[User Information]', e);
		}

		if (success) {
			router
				.push('/users/', '/users/', {
					locale: router.locale ?? router.defaultLocale,
				})
				.catch((e) => {
					config.general.isDev &&
					console.error('[User Information]', 'Unable to redirect to users page', e);
				})
				.finally(() => {
					setDeleteLoading(false);
				});
		} else {
			setDeleteLoading(false);
		}
	};

	const onModalClose = () => {
		setModalShown(false);
	};

	const onModalConfirm = () => {
		deleteUser().finally(() => {
			setModalShown(false);
		});
	};

	return (
		<Layout
			pageName={
				!error && !loading && (user?.accessLevel?.isStaff || user?.id === uid)
					? data?.user.firstName + ' ' + data?.user.middleName + ' ' + data?.user.lastName
					: t('user')
			}>
			<div className="flex flex-row select-none w-full md:max-w-75-percent">
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
				<Link
					disabled={!user?.accessLevel?.isStaff}
					className={
						'text-black font-light overflow-ellipsis overflow-hidden whitespace-nowrap break-all' +
						(!user?.accessLevel?.isStaff ? '' : ' hover:text-primary')
					}
					href="/users/">
					{t('title')}
				</Link>
				<div className="flex flex-1 w-full">
					{!error && <span className="text-black font-light mx-2 cursor-default">/</span>}
					{!error &&
					!loading &&
					data != null &&
					(user?.accessLevel?.isStaff || user?.id === uid) ? (
						<h1 className="font-bold text-primary cursor-default overflow-ellipsis overflow-hidden whitespace-nowrap break-all w-full">
							{data?.user.firstName} {data?.user.middleName} {data?.user.lastName}
						</h1>
					) : (
						!error &&
						loading && (
							<div className="animate-pulse">
								<div className="rounded h-6 w-64 bg-gray-300" />
							</div>
						)
					)}
				</div>
			</div>
			<div className="flex flex-1 flex-col mt-4">
				{error &&
					!loading &&
					!user?.accessLevel?.isStaff &&
					commonTranslate('notEnoughPermissions')}
				{error &&
					!loading &&
					(user?.accessLevel?.isStaff || user?.id === uid) &&
					commonTranslate('generalError')}
				{!error && !loading && (user?.accessLevel?.isStaff || user?.id === uid) && data != null && (
					<div className="flex flex-1 flex-col md:flex-row">
						<div className="py-2 px-4 bg-white shadow-md rounded flex-2 mr-0 md:mr-4 overflow-hidden break-words">
							<h1 className="text-primary font-semibold mb-4">{t('userInfo')}:</h1>
							<div className="flex flex-col mb-2">
								<span className="text-primary mb-0.5">{t('userId')}:</span>
								<span className="font-light">{data.user.id}</span>
							</div>
							<div className="flex flex-col mb-2">
								<span className="text-primary mb-0.5">{t('firstName')}:</span>
								<span className="font-light">{data.user.firstName}</span>
							</div>
							<div className="flex flex-col mb-2">
								<span className="text-primary mb-1">{t('middleName')}:</span>
								<span className="font-light">{data.user.middleName}</span>
							</div>
							<div className="flex flex-col mb-2">
								<span className="text-primary mb-0.5">{t('lastName')}:</span>
								<span className="font-light">{data.user.lastName}</span>
							</div>
							<div className="flex flex-col">
								<span className="text-primary mb-0.5">{t('userEmail')}:</span>
								<span className="font-light">{data.user.email}</span>
							</div>
						</div>
						<div className="flex-col flex flex-1 mt-4 md:mt-0">
							<div className="py-2 px-4 bg-white shadow-md rounded overflow-hidden break-words">
								<h1 className="text-primary font-semibold mb-4">{t('accessLevelInfo')}:</h1>
								<div className="flex flex-col mb-2">
									<span className="text-primary mb-0.5">{t('userLevel')}:</span>
									<span className="font-light">{data.user.accessLevel.name}</span>
								</div>
								<div className="flex flex-col mb-2">
									<span className="text-primary mb-0.5">{t('accessLevelDesc')}:</span>
									<span className="font-light">{data.user.accessLevel.description}</span>
								</div>
								<div className="flex flex-col">
									<span className="text-primary mb-0.5">{t('isAdmin')}</span>
									<div className="flex flex-row font-light items-center">
										{data.user.accessLevel.isStaff ? (
											<FaCheckCircle size={18} className="text-primary" />
										) : (
											<FaTimesCircle size={18} className="text-danger" />
										)}
										<span className="ml-2">
											{data.user.accessLevel.isStaff
												? commonTranslate('yes')
												: commonTranslate('no')}
										</span>
									</div>
								</div>
							</div>
							{user?.accessLevel?.isStaff && uid != user.id && (
								<div className="py-2 px-4 bg-white shadow-md rounded mt-4">
									<h1 className="text-primary font-semibold mb-4">{t('actions')}:</h1>
									<Button
										fluid
										buttonType="danger"
										title={t('removeUser')}
										onClick={() => setModalShown(true)}>
										<AiFillDelete size={18} className="mr-2" />{' '}
										<span className="flex">{t('removeUser')}</span>
									</Button>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</Layout>
	);
};

export const getStaticPaths: GetStaticPaths<{ uid: string }> = async () => {
	return {
		paths: [],
		fallback: 'blocking',
	};
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'users'])),
	},
});

export default UserInfo;

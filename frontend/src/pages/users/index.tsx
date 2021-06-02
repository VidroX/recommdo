import * as React from 'react';
import { useTranslation } from 'next-i18next';
import useUser, { User } from '../../hooks/useUser';
import Layout from '../../components/Layout';
import Button from '../../components/buttons/Button';
import { BsPlusSquare } from 'react-icons/bs';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../config';
import { useQuery } from '@apollo/client';
import { GET_USERS_LIST_QUERY } from '../../apollo/queries/user';
import { UsersList } from '../projects/[pid]/settings';
import DataTable from 'react-data-table-component';
import { useRouter } from 'next/router';

const Users = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('users');

	const router = useRouter();

	const user = useUser();

	const { loading, data, error } = useQuery<UsersList>(GET_USERS_LIST_QUERY, {
		fetchPolicy: 'network-only',
		variables: {
			skipAdmins: false,
		},
	});

	const columns = [
		{
			name: t('firstName'),
			selector: 'firstName',
			sortable: true,
		},
		{
			name: t('middleName'),
			selector: 'middleName',
			sortable: true,
		},
		{
			name: t('lastName'),
			selector: 'lastName',
			sortable: true,
		},
		{
			name: t('userLevel'),
			selector: 'accessLevel.name',
			sortable: true,
		},
		{
			name: t('isAdmin'),
			selector: 'accessLevel.isStaff',
			cell: (row: User) =>
				row.accessLevel.isStaff != null && row.accessLevel.isStaff ? (
					<FaCheckCircle size={18} className="text-primary" />
				) : (
					<FaTimesCircle size={18} className="text-danger" />
				),
			sortable: true,
		},
	];

	const onTableRowClick = (row: User) => {
		if (row?.id != null) {
			router
				.push('/users/[uid]/', '/users/' + row.id + '/', {
					locale: router.locale ?? router.defaultLocale,
				})
				.catch((e) => {
					config.general.isDev && console.error('[Users]', 'Unable to redirect to user page', e);
				});
		}
	};

	return (
		<Layout pageName={t('title')}>
			<div className="flex flex-1 justify-between items-center">
				<h1 className="text-primary font-bold">{t('title')}</h1>
				{user?.accessLevel.isStaff && (
					<Button title={t('addNewUser')} href="/users/create">
						<BsPlusSquare size={20} className="md:mr-2" />{' '}
						<span className="hidden md:flex">{t('addNewUser')}</span>
					</Button>
				)}
			</div>
			<div className="flex flex-1 flex-col mt-4">
				{!error &&
					!loading &&
					!user?.accessLevel?.isStaff &&
					commonTranslate('notEnoughPermissions')}
				{!error && !loading && user?.accessLevel.isStaff && data?.users != null && (
					<div className="shadow-md rounded bg-white">
						<DataTable
							noHeader
							onRowClicked={onTableRowClick}
							highlightOnHover
							columns={columns}
							data={data.users}
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
				)}
			</div>
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'users'])),
	},
});

export default Users;

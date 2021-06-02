import * as React from 'react';
import { useTranslation } from 'next-i18next';
import useUser, { UserAccessLevel } from '../../../hooks/useUser';
import Layout from '../../../components/Layout';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { config } from '../../../config';
import Link from '../../../components/buttons/Link';
import Input from '../../../components/inputs/Input';
import SelectBox from '../../../components/inputs/SelectBox';
import Button from '../../../components/buttons/Button';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_NEW_USER_MUTATION } from '../../../apollo/mutations/user';
import { GET_ACCESS_LEVELS_QUERY } from '../../../apollo/queries/user';

interface CreateUserValues {
	email: string;
	firstName: string;
	middleName: string;
	lastName: string;
	password: string;
	repeatPassword: string;
}

interface AccessLevelQuery {
	accessLevels: UserAccessLevel[];
}

interface Option {
	label: string;
	value: number;
}

const NewUser = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('users');
	const { t: authTranslate } = useTranslation('auth');

	const user = useUser();
	const router = useRouter();

	const [accessLevel, setAccessLevel] = useState(1);
	const [selectedOption, setSelectedOption] = useState<Option>({
		label: 'User',
		value: 1,
	});
	const [localLoading, setLocalLoading] = useState(false);
	const [apiErrors, setApiErrors] = useState<CreateUserValues>({
		email: '',
		password: '',
		firstName: '',
		lastName: '',
		middleName: '',
		repeatPassword: '',
	});

	const [createUser] = useMutation(CREATE_NEW_USER_MUTATION);

	const {
		loading: accessLevelsLoading,
		data: accessLevelsData,
		error: accessLevelsError,
	} = useQuery<AccessLevelQuery>(GET_ACCESS_LEVELS_QUERY);

	const selectOptions: Option[] = useMemo(() => {
		if (accessLevelsData?.accessLevels == null || accessLevelsData.accessLevels.length <= 0) {
			return [];
		}

		const accessLevelOptions: Option[] = [];
		for (const accessLevel of accessLevelsData.accessLevels) {
			accessLevelOptions.push({
				label: accessLevel.name,
				value: accessLevel.level,
			});
		}

		return accessLevelOptions;
	}, [accessLevelsData]);

	const CreateUserSchema = Yup.object().shape({
		firstName: Yup.string()
			.min(3, commonTranslate('smallField3'))
			.required(commonTranslate('requiredField')),
		middleName: Yup.string()
			.min(3, commonTranslate('smallField3'))
			.required(commonTranslate('requiredField')),
		lastName: Yup.string()
			.min(3, commonTranslate('smallField3'))
			.required(commonTranslate('requiredField')),
		email: Yup.string().email(authTranslate('invalidEmail')).required(commonTranslate('requiredField')),
		password: Yup.string().min(6, authTranslate('smallPassword')).required(commonTranslate('requiredField')),
		repeatPassword: Yup.string()
			.required(commonTranslate('requiredField'))
			.oneOf([Yup.ref('password'), null], authTranslate('passwordsMustMatch')),
	});

	const submitForm = async (
		values: CreateUserValues,
		{ setSubmitting }: FormikHelpers<CreateUserValues>
	) => {
		let success = false;

		try {
			await createUser({
				variables: {
					firstName: values.firstName,
					lastName: values.lastName,
					middleName: values.middleName,
					email: values.email,
					password: values.password,
					accessLevel,
				},
			});
			success = true;
		} catch (e) {
			const errors = e?.networkError?.result?.errors;

			if (errors != null && errors?.length > 0) {
				const currentError = errors[0];

				switch (currentError.extensions.code) {
					case 101: {
						setApiErrors({
							email: t('userEmailExits'),
							password: '',
							repeatPassword: '',
							firstName: '',
							lastName: '',
							middleName: '',
						});
						break;
					}
				}
			}

			config.general.isDev && console.log('[Crate User]', e);
		}

		setSubmitting(false);

		if (success) {
			router
				.push('/users/', '/users/', {
					locale: router.locale ?? router.defaultLocale,
				})
				.catch((e) => {
					config.general.isDev &&
						console.error('[Create User]', 'Unable to redirect to users page', e);
				})
				.finally(() => {
					setLocalLoading(false);
				});
		} else {
			setLocalLoading(false);
		}
	};

	return (
		<Layout pageName={t('addNewUser')}>
			<div className="flex flex-1 flex-col md:flex-row md:justify-between">
				<div className="flex flex-row select-none w-full md:max-w-50-percent mb-2 md:mb-0">
					<Link
						className="text-black font-light hover:text-primary overflow-ellipsis overflow-hidden whitespace-nowrap break-all"
						href="/users/">
						{t('title')}
					</Link>
					<div className="flex flex-1 w-0 md:w-full">
						<span className="text-black font-light mx-2 cursor-default">/</span>
						<h1 className="font-bold text-primary cursor-default overflow-ellipsis overflow-hidden whitespace-nowrap break-all w-full md:w-72">
							{t('addNewUser')}
						</h1>
					</div>
				</div>
			</div>
			<div className="flex flex-1 flex-col mt-4">
				{!user?.accessLevel?.isStaff
					? commonTranslate('notEnoughPermissions')
					: !accessLevelsError &&
					  !accessLevelsLoading && (
							<Formik
								initialValues={{
									firstName: '',
									middleName: '',
									lastName: '',
									email: '',
									password: '',
									repeatPassword: '',
								}}
								validationSchema={CreateUserSchema}
								onSubmit={submitForm}>
								{({
									values,
									errors,
									touched,
									handleChange,
									handleBlur,
									handleSubmit,
									isSubmitting,
								}) => (
									<form onSubmit={handleSubmit}>
										<Input
											id="firstName"
											name="firstName"
											label={t('firstName')}
											className="mb-4"
											placeholder={t('firstName')}
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.firstName}
											error={errors.firstName && touched.firstName ? errors.firstName : null}
										/>
										<Input
											id="middleName"
											name="middleName"
											label={t('middleName')}
											className="mb-4"
											placeholder={t('middleName')}
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.middleName}
											error={errors.middleName && touched.middleName ? errors.middleName : null}
										/>
										<Input
											id="lastName"
											name="lastName"
											label={t('lastName')}
											className="mb-4"
											placeholder={t('lastName')}
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.lastName}
											error={errors.lastName && touched.lastName ? errors.lastName : null}
										/>
										<Input
											id="email"
											name="email"
											type="email"
											label="E-Mail:"
											className="mb-4"
											placeholder="example@example.com"
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.email}
											error={
												apiErrors.email?.length > 0
													? apiErrors.email
													: errors.email && touched.email
													? errors.email
													: null
											}
										/>
										<Input
											id="password"
											name="password"
											type="password"
											label={authTranslate('password')}
											className="mb-4"
											placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.password}
											error={errors.password && touched.password ? errors.password : null}
										/>
										<Input
											id="repeatPassword"
											name="repeatPassword"
											type="password"
											label={authTranslate('repeatPassword')}
											className="mb-4"
											placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
											onChange={handleChange}
											onBlur={handleBlur}
											value={values.repeatPassword}
											error={
												errors.repeatPassword && touched.repeatPassword
													? errors.repeatPassword
													: null
											}
										/>
										<SelectBox
											id={'accessLevels-list'}
											name={'accessLevels-list'}
											label={t('userLevel')}
											options={selectOptions}
											defaultValue={selectedOption}
											value={selectedOption}
											onChange={(value: Option) => {
												setSelectedOption(value);
												setAccessLevel(value.value);
											}}
										/>
										<div className="mt-4 flex flex-row items-center justify-end">
											<Button
												submitButton
												title={commonTranslate('create')}
												loading={isSubmitting}
												disabled={isSubmitting}>
												{commonTranslate('create')}
											</Button>
										</div>
									</form>
								)}
							</Formik>
					  )}
			</div>
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, [
			'common',
			'users',
			'auth',
		])),
	},
});

export default NewUser;

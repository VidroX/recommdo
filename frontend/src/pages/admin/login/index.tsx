import * as React from 'react';
import { useEffect, useState } from 'react';
import { config } from '../../../config';
import { useRouter } from 'next/router';
import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../../../components/Layout';
import { useTranslation } from 'next-i18next';
import Input from '../../../components/inputs/Input';
import Button from '../../../components/buttons/Button';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION } from '../../../apollo/mutations/auth';
import { setAccessToken, setRefreshToken } from '../../../utils/userUtils';

interface LoginFormValues {
	email: string;
	password: string;
}

const LoginPage = () => {
	const { t } = useTranslation('auth');

	const { route, push, locale, defaultLocale } = useRouter();

	const [apiErrors, setApiErrors] = useState<LoginFormValues>({
		email: '',
		password: '',
	});

	const [login, { client: apolloClient }] = useMutation(LOGIN_MUTATION);

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			route != null &&
			route?.length > 0 &&
			(locale != null || defaultLocale != null)
		) {
			const token = localStorage?.getItem(config.api.authTokenLocation);
			if (token != null) {
				push('/', '/', { locale: locale ?? defaultLocale }).catch((e) => {
					console.error('Unable to redirect to main page', e);
				});
			}
		}
	}, [route, locale, defaultLocale]);

	const submitForm = async (
		values: LoginFormValues,
		{ setSubmitting }: FormikHelpers<LoginFormValues>
	) => {
		let success = false;

		try {
			const {
				data: { login: userData },
			} = await login({
				variables: {
					email: values.email,
					password: values.password,
				},
			});

			const tokens = userData?.tokens;

			if (tokens != null && tokens?.accessToken != null) {
				setAccessToken(tokens.accessToken);

				if (tokens?.refreshToken != null) {
					setRefreshToken(tokens.refreshToken);
				}
			}

			success = true;
		} catch (e) {
			const errors = e?.networkError?.result?.errors;

			if (errors != null && errors?.length > 0) {
				const currentError = errors[0];

				switch (currentError.extensions.code) {
					case 100: {
						setApiErrors({
							email: t('incorrectEmailPassword'),
							password: t('incorrectEmailPassword'),
						});
						break;
					}
				}
			}
		}

		setSubmitting(false);

		if (success) {
			try {
				await apolloClient.resetStore();
				await push('/', '/', { locale: locale ?? defaultLocale });
			} catch (e) {
				config.general.isDev && console.log(e);
			}
		}
	};

	const LoginSchema = Yup.object().shape({
		email: Yup.string().email(t('invalidEmail')).required(t('requiredField')),
		password: Yup.string().min(6, t('smallPassword')).required(t('requiredField')),
	});

	return (
		<Layout
			fullHeight
			pageName={t('headTitle')}
			showNavbar={false}
			showFooter={false}
			backgroundColor={'#e6e6e6'}>
			<div className="h-full flex flex-row items-center">
				<div className="max-w-full min-w-full rounded md:min-w-450 md:max-w-450 mx-auto bg-white shadow-md p-4">
					<p className="text-xl">
						{t('title')}{' '}
						<span className="font-semibold text-primary">{config.general.appName}</span>
					</p>
					<Formik
						initialValues={{ email: '', password: '' }}
						validationSchema={LoginSchema}
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
							<form onSubmit={handleSubmit} className="mt-5">
								<Input
									type="email"
									id="email"
									name="email"
									label="E-Mail"
									className="mb-2"
									placeholder="user@example.com"
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
									type="password"
									id="password"
									name="password"
									label={t('password')}
									className="mb-5"
									placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
									onChange={handleChange}
									onBlur={handleBlur}
									value={values.password}
									error={
										apiErrors.password?.length > 0
											? apiErrors.password
											: errors.password && touched.password
											? errors.password
											: null
									}
								/>
								<div className="flex flex-row justify-end">
									<Button submitButton loading={isSubmitting} disabled={isSubmitting}>
										{t('login')}
									</Button>
								</div>
							</form>
						)}
					</Formik>
				</div>
			</div>
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'auth'])),
	},
});

export default LoginPage;

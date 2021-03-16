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
import { Formik } from 'formik';

const LoginPage = () => {
	const { t } = useTranslation('auth');

	const { route, push, locale, defaultLocale } = useRouter();

	const [canceled, setCanceled] = useState(false);

	useEffect(() => {
		return () => {
			setCanceled(true);
		};
	}, []);

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
	}, [route, locale, defaultLocale, canceled]);

	const validateForm = (values: any) => {
		const errors = { email: null, password: null };

		if (!values.email) {
			errors.email = t('requiredField');
		} else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
			errors.email = t('invalidEmail');
		}

		if (!values.password) {
			errors.password = t('requiredField');
		} else if (values.password?.length < 6) {
			errors.password = t('smallPassword');
		}

		return errors;
	};

	const submitForm = (values: any, { setSubmitting }: any) => {
		setSubmitting(true);
		setTimeout(() => {
			alert(JSON.stringify(values, null, 2));
			setSubmitting(false);
		}, 400);
	};

	return (
		<Layout
			fullHeight
			pageName={t('headTitle')}
			showNavbar={false}
			showFooter={false}
			backgroundColor={'#e6e6e6'}>
			<div className="h-full flex flex-row items-center">
				<div className="max-w-full min-w-full md:min-w-450 md:max-w-450 mx-auto bg-white shadow-md rounded p-4">
					<p className="text-xl">
						{t('title')}{' '}
						<span className="font-semibold text-primary">{config.general.appName}</span>
					</p>
					<Formik
						initialValues={{ email: '', password: '' }}
						validate={validateForm}
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
									error={errors.email && touched.email ? errors.email : null}
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
									error={errors.password && touched.password ? errors.password : null}
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

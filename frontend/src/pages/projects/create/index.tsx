import * as React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { config } from '../../../config';
import { useTranslation } from 'next-i18next';
import Layout from '../../../components/Layout';
import Input from '../../../components/inputs/Input';
import Button from '../../../components/buttons/Button';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface CreateProjectFormValues {
	projectName: string;
}

const dropzoneStyles = [
	'mb-2',
	'px-2',
	'py-6',
	'border-2',
	'border-dotted',
	'rounded',
	'border-primary',
	'focus:outline-none',
	'focus:border-solid',
	'hover:border-solid',
	'focus:ring',
	'focus:ring-opacity-50',
	'focus:ring-primary',
	'duration-75'
].join(' ');

const CreateProject = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');

	const [createErrors, setCreateErrors] = useState<CreateProjectFormValues>({
		projectName: '',
	});

	const onDrop = useCallback((acceptedFiles) => {
		console.log(acceptedFiles);
	}, [])
	const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

	const submitForm = async (
		values: CreateProjectFormValues,
		{ setSubmitting }: FormikHelpers<CreateProjectFormValues>
	) => {
		let success = false;

		try {
			/*const {
				data: { login: userData },
			} = await login({
				variables: {
					email: values.email,
					password: values.password,
				},
			});*/
		} catch (e) {
			const errors = e?.networkError?.result?.errors;

			if (errors != null && errors?.length > 0) {
				const currentError = errors[0];

				switch (currentError.extensions.code) {
					case 100: {
						setCreateErrors({
							projectName: t('nameExists'),
						});
						break;
					}
				}
			}
		}

		setSubmitting(false);

		if (success) {
			try {

			} catch (e) {
				config.general.isDev && console.log(e);
			}
		}
	};

	const CreateProjectSchema = Yup.object().shape({
		projectName: Yup.string().required(commonTranslate('requiredField')),
	});

	return (
		<Layout pageName={t('newProject')}>
			<div className="flex flex-1 justify-between items-center">
				<h1 className="text-primary font-bold">{t('newProject')}</h1>
			</div>
			<Formik
				initialValues={{ projectName: '' }}
				validationSchema={CreateProjectSchema}
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
						<div {...getRootProps()} className={dropzoneStyles}>
							<input {...getInputProps()} />
							{
								isDragActive ?
									<p>{t('dragHere')}</p> :
									<p>{t('dragAndDropDataset')}</p>
							}
						</div>
						<Input
							type="text"
							id="projectName"
							name="projectName"
							label={t('projectName')}
							className="mb-2"
							placeholder="Example name"
							onChange={handleChange}
							onBlur={handleBlur}
							value={values.projectName}
							error={
								createErrors.projectName?.length > 0
									? createErrors.projectName
									: errors.projectName && touched.projectName
									? errors.projectName
									: null
							}
						/>
						<div className="flex flex-row justify-end items-center mt-6">
							<Button submitButton loading={isSubmitting} disabled={isSubmitting}>
								{commonTranslate('create')}
							</Button>
						</div>
					</form>
				)}
			</Formik>
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'projects'])),
	},
});

export default CreateProject;

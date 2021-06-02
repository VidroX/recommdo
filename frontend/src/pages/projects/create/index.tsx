import * as React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import { config } from '../../../config';
import { useTranslation } from 'next-i18next';
import Layout from '../../../components/Layout';
import Input from '../../../components/inputs/Input';
import Button from '../../../components/buttons/Button';
import FileButton from '../../../components/buttons/FileButton';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import SelectBox from '../../../components/inputs/SelectBox';
import IconButtonWrapper from '../../../components/buttons/IconButtonWrapper';
import { VscClose } from 'react-icons/vsc';
import { useMutation } from '@apollo/client';
import { CREATE_PROJECT_MUTATION } from '../../../apollo/mutations/projects';
import { useRouter } from 'next/router';
import useUser from '../../../hooks/useUser';
import Link from '../../../components/buttons/Link';

interface CreateProjectFormValues {
	projectName: string;
}

interface CSVHeaderFile {
	file: File;
	headers: string[];
}

interface Option {
	value: string;
	label: string;
}

interface Metadata {
	metaId?: string;
	name?: string;
}

interface SubscriptionsData {
	subscriptionUserId?: string;
	subscriptionMetaId?: string;
	subscriptionStartFrom?: string;
	subscriptionEndAt?: string;
}

interface SelectedOption {
	id: string;
	name: string;
	option: Option;
	metadata: Metadata | null;
	error?: string;
	innerErrors: {
		metaIdError?: string | null;
		subscriptionsUserIdError?: string | null;
		subscriptionsMetaIdError?: string | null;
		subscriptionsStartFromError?: string | null;
		subscriptionsEndAtError?: string | null;
	};
	subscriptionsData: SubscriptionsData | null;
}

interface UpdateSelectedOption {
	id?: string;
	name?: string;
	option?: Option;
	error?: string;
	metadata?: Metadata | null;
	subscriptionsData?: SubscriptionsData | null;
	innerErrors?: {
		metaIdError?: string | null;
		subscriptionsUserIdError?: string | null;
		subscriptionsMetaIdError?: string | null;
		subscriptionsStartFromError?: string | null;
		subscriptionsEndAtError?: string | null;
	};
}

interface ProjectMetadata {
	metaFileName?: string | null;
	metaIdHeader?: string | null;
	metaNameHeader?: string | null;
	subscriptionsFileName?: string | null;
	subscriptionsMetaIdHeader?: string | null;
	subscriptionsUserIdHeader?: string | null;
	subscriptionsStartFromHeader?: string | null;
	subscriptionsEndAtHeader?: string | null;
}

interface OptionValues {
	id: string;
	name: string;
	options: Option[];
}

const dropzoneStyles = [
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
	'duration-75',
].join(' ');

const csvMimeTypes = [
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-excel',
	'application/csv',
	'text/comma-separated-values',
	'text/csv',
	'.csv',
];

const CreateProject = () => {
	const { t: commonTranslate } = useTranslation('common');
	const { t } = useTranslation('projects');

	const { push, locale, defaultLocale } = useRouter();

	const user = useUser();

	const [createErrors, setCreateErrors] = useState<CreateProjectFormValues>({
		projectName: '',
	});
	const [files, setFiles] = useState<File[]>([]);
	const [fileHeaders, setFileHeaders] = useState<CSVHeaderFile[]>([]);
	const [dropzoneError, setDropzoneError] = useState<string | null>(null);
	const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
	const [optionError, setOptionError] = useState<string | null>(null);
	const [fileTypes, setFileTypes] = useState<Option[]>([
		{
			label: t('userSubscriptions'),
			value: 'subscription-data',
		},
		{
			label: t('editionsInformation'),
			value: 'metadata',
		},
	]);

	const [createProject] = useMutation(CREATE_PROJECT_MUTATION);

	const onDrop = useCallback(
		(acceptedFiles) => {
			const filesToUpload: File[] = [];

			for (const file of acceptedFiles) {
				const fileExists = files.findIndex((obj) => obj.name === file.name) > -1;
				if (!fileExists && csvMimeTypes.includes(file.type)) {
					filesToUpload.push(file);
				}
			}

			if (filesToUpload?.length > 0) {
				setDropzoneError(null);
			}

			setFiles((files) => [...files, ...filesToUpload]);
		},
		[files]
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: csvMimeTypes.join(', '),
	});

	useEffect(() => {
		setFileHeaders([]);

		if (files != null && files?.length > 0) {
			for (const file of files) {
				const reader = new FileReader();

				reader.onload = (event) => {
					if (event.target != null) {
						const data = event.target.result;
						if (typeof data === 'string') {
							const headers = data?.split('\n')[0]?.replace(/"/g, '')?.split(',');

							if (headers?.length > 0) {
								setFileHeaders((fileHeaders) => [...fileHeaders, { file, headers }]);
							}
						}
					}
				};

				reader.readAsText(file);
			}
		}
	}, [files]);

	const submitForm = async (
		values: CreateProjectFormValues,
		{ setSubmitting }: FormikHelpers<CreateProjectFormValues>
	) => {
		setDropzoneError(null);

		let success = false;
		const projectMetadata: ProjectMetadata = {
			metaFileName: null,
			metaIdHeader: null,
			metaNameHeader: null,
			subscriptionsFileName: null,
			subscriptionsMetaIdHeader: null,
			subscriptionsUserIdHeader: null,
			subscriptionsStartFromHeader: null,
			subscriptionsEndAtHeader: null,
		};

		if (selectedOptions?.length > 0) {
			let errorsFound = false;
			for (const option1 of selectedOptions) {
				option1.error = undefined;
				if (option1.metadata != null) {
					option1.innerErrors.metaIdError = null;
				}
				if (option1.subscriptionsData != null) {
					option1.innerErrors.subscriptionsUserIdError = null;
					option1.innerErrors.subscriptionsMetaIdError = null;
					option1.innerErrors.subscriptionsStartFromError = null;
					option1.innerErrors.subscriptionsEndAtError = null;
				}

				for (const option2 of selectedOptions) {
					if (option1.id !== option2.id && option1.option.value === option2.option.value) {
						option1.error = t('identicalFileTypes');
						option2.error = t('identicalFileTypes');
						errorsFound = true;
					}
				}

				if (
					option1.option.value === fileTypes[1].value &&
					(option1.metadata == null || option1.metadata?.metaId == null)
				) {
					option1.innerErrors.metaIdError = commonTranslate('requiredField');
					errorsFound = true;
				}

				if (
					option1.option.value === fileTypes[0].value &&
					(option1.subscriptionsData == null ||
						option1.subscriptionsData?.subscriptionUserId == null)
				) {
					option1.innerErrors.subscriptionsUserIdError = commonTranslate('requiredField');
					errorsFound = true;
				}

				if (
					option1.option.value === fileTypes[0].value &&
					(option1.subscriptionsData == null ||
						option1.subscriptionsData?.subscriptionMetaId == null)
				) {
					option1.innerErrors.subscriptionsMetaIdError = commonTranslate('requiredField');
					errorsFound = true;
				}

				if (option1.option.value === fileTypes[1].value && option1.metadata != null) {
					projectMetadata.metaFileName = option1.name;
					projectMetadata.metaIdHeader = option1.metadata.metaId;
					projectMetadata.metaNameHeader = option1.metadata.name;
				}

				if (option1.option.value === fileTypes[0].value && option1.subscriptionsData != null) {
					projectMetadata.subscriptionsFileName = option1.name;
					projectMetadata.subscriptionsMetaIdHeader = option1.subscriptionsData.subscriptionMetaId;
					projectMetadata.subscriptionsUserIdHeader = option1.subscriptionsData.subscriptionUserId;
					projectMetadata.subscriptionsStartFromHeader =
						option1.subscriptionsData.subscriptionStartFrom;
					projectMetadata.subscriptionsEndAtHeader = option1.subscriptionsData.subscriptionEndAt;
				}
			}

			if (errorsFound) {
				setSubmitting(false);
				return;
			}
		} else if (files.length > 0 && selectedOptions?.length <= 0) {
			setOptionError(t('fileTypeEmpty'));
			setSubmitting(false);
			return;
		}

		try {
			const result = await createProject({
				variables: {
					projectName: values.projectName,
					projectMetadataInput: projectMetadata,
					files,
				},
			});

			success = true;
		} catch (e) {
			const errors = e?.networkError?.result?.errors;

			if (errors != null && errors?.length > 0) {
				const currentError = errors[0];

				switch (currentError.extensions.code) {
					case 200: {
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
				await push('/', '/', { locale: locale ?? defaultLocale });
			} catch (e) {
				config.general.isDev && console.log(e);
			}
		}
	};

	const CreateProjectSchema = Yup.object().shape({
		projectName: Yup.string().required(commonTranslate('requiredField')),
	});

	const onRemove = (name: string) => {
		setFiles((filesList) => filesList.filter((obj) => obj.name !== name));
		setSelectedOptions((selOptions) => selOptions.filter((obj) => obj.name !== name));
	};

	const optionsArray = useMemo(() => {
		const options: OptionValues[] = [];

		for (const fileHeader of fileHeaders) {
			const optionsToInsert: Option[] = [];

			if (fileHeader.file.name != null && fileHeader.headers?.length > 0) {
				for (const header of fileHeader.headers) {
					optionsToInsert.push({
						label: header,
						value: header,
					});
				}
			}

			if (optionsToInsert?.length > 0) {
				options.push({
					id: fileHeader.file.name.split('.')[0],
					name: fileHeader.file.name,
					options: optionsToInsert,
				});
			}
		}

		return options;
	}, [fileHeaders]);

	const getSelectedOption = useCallback(
		(id: string): SelectedOption | undefined => selectedOptions.find((obj) => obj.id === id),
		[selectedOptions]
	);

	const updateSelectValue = useCallback(
		(id: string, newValues: SelectedOption | UpdateSelectedOption) => {
			setSelectedOptions((selOptions) => {
				return selOptions.map((obj) => {
					if (obj.id === id) {
						if (newValues.id != null) {
							obj.id = newValues.id;
						}
						if (newValues.name != null) {
							obj.name = newValues.name;
						}
						if (newValues.option != null) {
							obj.option = newValues.option;
						}
						if (newValues.metadata != null || newValues.metadata === null) {
							obj.metadata = newValues.metadata;
						}
						if (newValues.subscriptionsData != null || newValues.subscriptionsData === null) {
							obj.subscriptionsData = newValues.subscriptionsData;
						}
						if (newValues.innerErrors != null) {
							obj.innerErrors = newValues.innerErrors;
						}
					}

					return obj;
				});
			});
		},
		[selectedOptions]
	);

	const renderForm = () => {
		return (
			<Formik
				initialValues={{ projectName: '' }}
				validationSchema={CreateProjectSchema}
				onSubmit={submitForm}>
				{({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
					<form onSubmit={handleSubmit} className="mt-5">
						<div
							{...getRootProps()}
							className={dropzoneStyles
								.concat(files?.length > 0 ? '' : ' cursor-pointer')
								.concat(dropzoneError != null && dropzoneError?.length > 0 ? '' : ' mb-3')}>
							<input
								{...getInputProps()}
								multiple
								accept={csvMimeTypes.join(', ')}
								disabled={files?.length > 0 ?? false}
							/>
							{files?.length > 0 ? (
								files.map((file) => (
									<FileButton key={file.name} name={file.name} onRemove={onRemove} />
								))
							) : isDragActive ? (
								<p className="select-none">{t('dragHere')}</p>
							) : (
								<p className="select-none">{t('dragAndDropDataset')}</p>
							)}
						</div>
						{dropzoneError != null && dropzoneError?.length > 0 && (
							<p className="text-red-500 mt-0.5 mb-3">{dropzoneError}</p>
						)}
						{files?.length > 0 && (
							<button
								className="text-red-300 hover:text-red-500 mt-0.5 mb-3"
								onClick={() => {
									setFiles([]);
									setSelectedOptions([]);
								}}>
								{t('deleteAll')}
							</button>
						)}
						<Input
							type="text"
							id="projectName"
							name="projectName"
							label={t('projectName')}
							className="mb-4"
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
						<div className="mb-4">
							{optionsArray?.length > 0 && <h1 className="mb-2">{t('selectKeyFeatures')}:</h1>}
							{optionsArray.map((option, index) => (
								<div
									key={'header-' + option.name}
									className={
										'max-w-full min-w-full rounded bg-white shadow-md p-4' +
										(index !== optionsArray.length - 1 ? ' mb-4' : '')
									}>
									<div className="flex flex-1 flex-row justify-between items-center">
										<p className="mb-2 font-semibold">{option.name}</p>
										<IconButtonWrapper
											size={24}
											color="red-300"
											onClick={() => onRemove(option.name)}>
											<VscClose size={18} />
										</IconButtonWrapper>
									</div>
									<SelectBox
										id={option.id + '-file-types'}
										name={option.id + '-file-types'}
										label={t('fileType')}
										className={'mb-4'}
										options={fileTypes}
										value={getSelectedOption(option.id)?.option ?? undefined}
										error={
											optionError == null
												? getSelectedOption(option.id)?.error ?? undefined
												: optionError
										}
										onChange={(value: Option) => {
											const existingObj = selectedOptions.find((obj) => obj.id === option.id);

											if (existingObj) {
												updateSelectValue(option.id, {
													id: option.id,
													name: option.name,
													option: value,
													metadata: null,
													subscriptionsData: null,
													innerErrors: {
														subscriptionsUserIdError: null,
														subscriptionsMetaIdError: null,
														subscriptionsStartFromError: null,
														subscriptionsEndAtError: null,
														metaIdError: null,
													},
												});
											} else {
												setSelectedOptions((selOptions) => [
													...selOptions,
													{
														id: option.id,
														option: value,
														name: option.name,
														subscriptionsData: null,
														metadata: null,
														innerErrors: {
															subscriptionsUserIdError: null,
															subscriptionsMetaIdError: null,
															subscriptionsStartFromError: null,
															subscriptionsEndAtError: null,
															metaIdError: null,
														},
													},
												]);
											}
										}}
									/>
									{getSelectedOption(option.id) != null ? (
										getSelectedOption(option.id)?.option.value === fileTypes[1].value ? (
											<>
												<SelectBox
													id={option.id + '-meta-id'}
													name={option.id + '-meta-id'}
													label={t('columnMetaId')}
													className={'mb-4'}
													value={
														getSelectedOption(option.id)?.metadata?.metaId != null
															? {
																	label: getSelectedOption(option.id)?.metadata?.metaId,
																	value: getSelectedOption(option.id)?.metadata?.metaId,
															  }
															: undefined
													}
													error={getSelectedOption(option.id)?.innerErrors.metaIdError ?? undefined}
													options={option.options}
													onChange={(value: any) => {
														updateSelectValue(option.id, {
															metadata: {
																...getSelectedOption(option.id)?.metadata,
																metaId: value.value,
															},
														});
													}}
												/>
												<SelectBox
													id={option.id + '-meta-name'}
													name={option.id + '-meta-name'}
													label={t('columnMetaName')}
													className={'mb-4'}
													value={
														getSelectedOption(option.id)?.metadata?.name != null
															? {
																	label: getSelectedOption(option.id)?.metadata?.name,
																	value: getSelectedOption(option.id)?.metadata?.name,
															  }
															: undefined
													}
													options={option.options}
													onChange={(value: any) => {
														updateSelectValue(option.id, {
															metadata: {
																...getSelectedOption(option.id)?.metadata,
																name: value.value,
															},
														});
													}}
												/>
											</>
										) : (
											<>
												<SelectBox
													id={option.id + '-user-id'}
													name={option.id + '-user-id'}
													label={t('columnUserId')}
													className={'mb-4'}
													error={
														getSelectedOption(option.id)?.innerErrors.subscriptionsUserIdError ??
														undefined
													}
													value={
														getSelectedOption(option.id)?.subscriptionsData?.subscriptionUserId !=
														null
															? {
																	label: getSelectedOption(option.id)?.subscriptionsData
																		?.subscriptionUserId,
																	value: getSelectedOption(option.id)?.subscriptionsData
																		?.subscriptionUserId,
															  }
															: undefined
													}
													options={option.options}
													onChange={(value: any) => {
														updateSelectValue(option.id, {
															subscriptionsData: {
																...getSelectedOption(option.id)?.subscriptionsData,
																subscriptionUserId: value.value,
															},
														});
													}}
												/>
												<SelectBox
													id={option.id + '-subscription-meta-id'}
													name={option.id + '-subscription-meta-id'}
													label={t('columnMetaId')}
													className={'mb-4'}
													error={
														getSelectedOption(option.id)?.innerErrors.subscriptionsMetaIdError ??
														undefined
													}
													value={
														getSelectedOption(option.id)?.subscriptionsData?.subscriptionMetaId !=
														null
															? {
																	label: getSelectedOption(option.id)?.subscriptionsData
																		?.subscriptionMetaId,
																	value: getSelectedOption(option.id)?.subscriptionsData
																		?.subscriptionMetaId,
															  }
															: undefined
													}
													options={option.options}
													onChange={(value: any) => {
														updateSelectValue(option.id, {
															subscriptionsData: {
																...getSelectedOption(option.id)?.subscriptionsData,
																subscriptionMetaId: value.value,
															},
														});
													}}
												/>
												<SelectBox
													id={option.id + '-subscription-start'}
													name={option.id + '-subscription-start'}
													label={t('subscriptionStartFromHeader')}
													className={'mb-4'}
													error={
														getSelectedOption(option.id)?.innerErrors.subscriptionsStartFromError ??
														undefined
													}
													value={
														getSelectedOption(option.id)?.subscriptionsData
															?.subscriptionStartFrom != null
															? {
																	label: getSelectedOption(option.id)?.subscriptionsData
																		?.subscriptionStartFrom,
																	value: getSelectedOption(option.id)?.subscriptionsData
																		?.subscriptionStartFrom,
															  }
															: undefined
													}
													options={option.options}
													onChange={(value: any) => {
														updateSelectValue(option.id, {
															subscriptionsData: {
																...getSelectedOption(option.id)?.subscriptionsData,
																subscriptionStartFrom: value.value,
															},
														});
													}}
												/>
												<SelectBox
													id={option.id + '-subscription-end'}
													name={option.id + '-subscription-end'}
													label={t('subscriptionEndAtHeader')}
													className={'mb-4'}
													error={
														getSelectedOption(option.id)?.innerErrors.subscriptionsEndAtError ??
														undefined
													}
													value={
														getSelectedOption(option.id)?.subscriptionsData?.subscriptionEndAt !=
														null
															? {
																	label: getSelectedOption(option.id)?.subscriptionsData
																		?.subscriptionEndAt,
																	value: getSelectedOption(option.id)?.subscriptionsData
																		?.subscriptionEndAt,
															  }
															: undefined
													}
													options={option.options}
													onChange={(value: any) => {
														updateSelectValue(option.id, {
															subscriptionsData: {
																...getSelectedOption(option.id)?.subscriptionsData,
																subscriptionEndAt: value.value,
															},
														});
													}}
												/>
											</>
										)
									) : null}
								</div>
							))}
						</div>
						<div className="flex flex-row justify-end items-center">
							<Button submitButton loading={isSubmitting} disabled={isSubmitting}>
								{commonTranslate('create')}
							</Button>
						</div>
					</form>
				)}
			</Formik>
		);
	};

	const renderError = () => {
		return <div className="mt-5 font-semibold">{commonTranslate('notEnoughPermissions')}</div>;
	};

	return (
		<Layout pageName={t('newProject')}>
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
							{t('addNewProject')}
						</h1>
					</div>
				</div>
			</div>
			{user?.accessLevel != null && user.accessLevel?.level <= 1 && renderError()}
			{user?.accessLevel != null && user.accessLevel?.level > 1 && renderForm()}
		</Layout>
	);
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
	props: {
		...(await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common', 'projects'])),
	},
});

export default CreateProject;

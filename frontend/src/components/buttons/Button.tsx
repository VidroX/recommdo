import * as React from 'react';
import { MouseEvent } from 'react';
import Link from './Link';
import { CgSpinner } from 'react-icons/cg';
import { UrlObject } from 'url';

interface ButtonProps {
	onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
	loading?: boolean;
	href?: string | UrlObject;
	dense?: boolean;
	extraClasses?: string;
	outlined?: boolean;
	submitButton?: boolean;
	disabled?: boolean;
	title?: string;
	locale?: string;
	rounded?: boolean;
	buttonType?: 'primary' | 'danger';
}

const defaultClasses = [
	'focus:outline-none',
	'border-2',
	'focus:ring',
	'focus:ring-opacity-50',
	'duration-75',
	'disabled:select-none',
	'disabled:cursor-default',
].join(' ');

const outlinedClasses = [
	'bg-transparent',
	'border-2',
	'border-opacity-50',
	'focus:outline-none',
	'focus:ring-2',
	'focus:ring-opacity-50',
	'duration-75',
	'disabled:select-none',
	'disabled:cursor-default',
].join(' ');

const Button: React.FC<ButtonProps> = ({
	href = null,
	buttonType = 'primary',
	locale = undefined,
	loading = false,
	onClick = (e) => {},
	children,
	extraClasses = '',
	outlined = false,
	submitButton = false,
	disabled = false,
	title = undefined,
	rounded = true,
	dense = false,
}) => {
	const classes = outlined
		? outlinedClasses +
		  (buttonType === 'primary'
				? ' text-primary border-primary focus:ring-primary hover:bg-primary hover:text-white'
				: ' text-danger border-danger focus:ring-danger hover:bg-danger hover:text-white')
		: defaultClasses +
		  (buttonType === 'primary'
				? ' border-primary hover:border-primary-dark focus:ring-primary text-white bg-primary hover:bg-primary-dark'
				: ' border-danger hover:border-danger-dark focus:ring-danger text-white bg-danger hover:bg-danger-dark');

	const renderButtonContents = () => {
		return (
			<div
				className={
					'flex flex-row items-center font-semibold' +
					(loading
						? dense
							? ' my-1 ml-2 mr-2'
							: ' my-1.5 ml-3 mr-5'
						: dense
						? ' my-1 mx-4'
						: ' my-1.5 mx-8')
				}>
				{loading && <CgSpinner className="animate-spin w-5 h-5 mr-3" />}
				{children}
			</div>
		);
	};

	if (href != null) {
		if (disabled) {
			return (
				<div
					title={title}
					className={
						classes +
						(' inline-block' + (extraClasses?.length > 0 ? ' ' + extraClasses : '')) +
						(rounded != null && rounded ? ' rounded' : '')
					}>
					{renderButtonContents()}
				</div>
			);
		}

		return (
			<Link
				locale={locale}
				title={title}
				href={href}
				className={
					classes +
					(' inline-block' + (extraClasses?.length > 0 ? ' ' + extraClasses : '')) +
					(rounded != null && rounded ? ' rounded' : '')
				}>
				{renderButtonContents()}
			</Link>
		);
	}

	return (
		<button
			title={title}
			disabled={disabled}
			type={submitButton ? 'submit' : 'button'}
			className={
				classes +
				(' inline-block' + (extraClasses?.length > 0 ? ' ' + extraClasses : '')) +
				(rounded != null && rounded ? ' rounded' : '')
			}
			onClick={onClick}>
			{renderButtonContents()}
		</button>
	);
};

export default Button;

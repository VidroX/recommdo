import * as React from 'react';
import { MouseEvent } from 'react';
import Link from './Link';
import { CgSpinner } from 'react-icons/cg';

interface ButtonProps {
	onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
	loading?: boolean;
	href?: string;
	extraClasses?: string;
	outlined?: boolean;
	submitButton?: boolean;
	disabled?: boolean;
	title?: string;
	locale?: string;
}

const defaultClasses = [
	'rounded',
	'bg-primary',
	'text-white',
	'focus:outline-none',
	'focus:ring',
	'focus:ring-opacity-50',
	'focus:ring-primary',
	'duration-75',
	'disabled:select-none',
	'disabled:cursor-default',
];

const outlinedClasses = [
	'rounded',
	'bg-transparent',
	'border-2',
	'border-opacity-50',
	'border-primary',
	'text-primary',
	'focus:outline-none',
	'focus:ring-2',
	'focus:ring-opacity-50',
	'focus:ring-primary',
	'hover:bg-primary',
	'hover:text-white',
	'duration-75',
	'disabled:select-none',
	'disabled:cursor-default',
];

const Button: React.FC<ButtonProps> = ({
	href = null,
	locale = undefined,
	loading = false,
	onClick = (e) => {},
	children,
	extraClasses = '',
	outlined = false,
	submitButton = false,
	disabled = false,
	title = undefined,
}) => {
	const classes = outlined ? outlinedClasses : defaultClasses;

	const renderButtonContents = () => {
		return (
			<div
				className={
					'flex flex-row items-center font-semibold my-2' + (loading ? ' ml-3 mr-5' : ' mx-8')
				}>
				{loading && <CgSpinner className="animate-spin w-5 h-5 mr-3" />}
				{children}
			</div>
		);
	};

	if (href != null && href?.length > 0) {
		if (disabled) {
			return (
				<div
					title={title}
					className={classes
						.join(' ')
						.concat(' inline-block' + (extraClasses?.length > 0 ? ' ' + extraClasses : ''))}>
					{renderButtonContents()}
				</div>
			);
		}

		return (
			<Link
				locale={locale}
				title={title}
				href={href}
				className={classes
					.join(' ')
					.concat(' inline-block' + (extraClasses?.length > 0 ? ' ' + extraClasses : ''))}>
				{renderButtonContents()}
			</Link>
		);
	}

	return (
		<button
			title={title}
			disabled={disabled}
			type={submitButton ? 'submit' : 'button'}
			className={classes.join(' ').concat(extraClasses?.length > 0 ? ' ' + extraClasses : '')}
			onClick={onClick}>
			{renderButtonContents()}
		</button>
	);
};

export default Button;

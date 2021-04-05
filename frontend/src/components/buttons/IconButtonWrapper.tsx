import * as React from 'react';
import { MouseEvent } from 'react';
import Link from './Link';
import { CgSpinner } from 'react-icons/cg';

interface IconButtonWrapperProps {
	onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
	loading?: boolean;
	href?: string;
	extraClasses?: string;
	disabled?: boolean;
	title?: string;
	locale?: string;
	submitButton?: boolean;
	size?: number;
	color?: string;
}

const defaultClasses = [
	'text-white',
	'focus:outline-none',
	'focus:ring',
	'focus:ring-opacity-50',
	'duration-75',
	'disabled:select-none',
	'disabled:cursor-default',
	'cursor-pointer',
];

const IconButtonWrapper: React.FC<IconButtonWrapperProps> = ({
	href = null,
	locale = undefined,
	loading = false,
	onClick = (e) => {},
	children,
	extraClasses = '',
	disabled = false,
	title = undefined,
	submitButton = false,
	size = 24,
	color = '',
	...rest
}) => {
	const renderButtonContents = () => {
		return (
			<div
				className={'flex flex-row items-center justify-center text-black'.concat(
					color?.length > 0 ? ' text-' + color : ''
				)}>
				{loading ? <CgSpinner className="animate-spin w-5 h-5 mr-3" /> : children}
			</div>
		);
	};

	if (href != null && href?.length > 0) {
		if (disabled) {
			return (
				<div
					title={title}
					style={{
						width: size,
						height: size,
						borderRadius: size,
					}}
					className={defaultClasses
						.join(' ')
						.concat(
							' inline-block' +
								(extraClasses?.length > 0 ? ' ' + extraClasses : '') +
								' focus:ring-' +
								(color?.length > 0 ? color : 'primary')
						)}
					{...rest}>
					{renderButtonContents()}
				</div>
			);
		}

		return (
			<Link
				locale={locale}
				title={title}
				href={href}
				style={{
					width: size,
					height: size,
					borderRadius: size,
				}}
				className={defaultClasses
					.join(' ')
					.concat(
						' inline-block' +
							(extraClasses?.length > 0 ? ' ' + extraClasses : '') +
							' focus:ring-' +
							(color?.length > 0 ? color : 'primary')
					)}
				{...rest}>
				{renderButtonContents()}
			</Link>
		);
	}

	return (
		<button
			title={title}
			disabled={disabled}
			type={submitButton ? 'submit' : 'button'}
			style={{
				width: size,
				height: size,
				borderRadius: size,
			}}
			className={defaultClasses
				.join(' ')
				.concat(
					' inline-block' +
						(extraClasses?.length > 0 ? ' ' + extraClasses : '') +
						' focus:ring-' +
						(color?.length > 0 ? color : 'primary')
				)}
			onClick={onClick}
			{...rest}>
			{renderButtonContents()}
		</button>
	);
};

export default IconButtonWrapper;

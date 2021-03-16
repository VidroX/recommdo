import * as React from 'react';
import { ChangeEvent, FocusEvent, FormEvent, RefObject } from 'react';

interface InputProps {
	type?: string;
	value?: string;
	placeholder?: string;
	id: string;
	name: string;
	label?: string | null;
	className?: string;
	error?: string | null;
	onSubmit?: (e: FormEvent<HTMLInputElement>) => void;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	onBlur?: (e: FocusEvent<any>) => void;
}

const outlinedGeneralClasses = [
	'flex',
	'w-full',
	'mt-1',
	'rounded',
	'border-transparent',
	'bg-gray-100',
	'outline-none',
	'focus:bg-white',
	'focus:ring-0',
	'duration-75',
];

const errorClasses = ['border-red-500', 'focus:border-red-500'];

const nonErrorClasses = ['focus:border-primary'];

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			id,
			name,
			type = 'text',
			label = null,
			value = '',
			placeholder = '',
			className = '',
			error = null,
			onChange = (e) => {},
			onBlur = (e) => {},
			onSubmit = (e) => {},
			...rest
		},
		ref
	) => {
		return (
			<div className={className}>
				{label != null && (
					<label htmlFor={id} className="block">
						{label}:
					</label>
				)}
				<div className="block">
					<input
						ref={ref}
						className={outlinedGeneralClasses
							.join(' ')
							.concat(
								error != null ? ' ' + errorClasses.join(' ') : ' ' + nonErrorClasses.join(' ')
							)}
						id={id}
						name={name}
						type={type}
						value={value}
						placeholder={placeholder}
						onChange={onChange}
						onBlur={onBlur}
						onSubmit={onSubmit}
						{...rest}
					/>
					{error != null && <span className="text-red-500 mt-1">{error}</span>}
				</div>
			</div>
		);
	}
);

export default Input;

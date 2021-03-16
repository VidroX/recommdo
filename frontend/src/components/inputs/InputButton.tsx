import * as React from 'react';

interface InputButtonProps {
	type?: 'button' | 'submit';
	value?: string;
	id: string;
	name: string;
	className?: string;
	outlined?: boolean;
}

const defaultClasses = [
	'rounded',
	'px-8',
	'py-2',
	'bg-primary',
	'text-white',
	'focus:outline-none',
	'focus:ring',
	'focus:ring-opacity-50',
	'focus:ring-primary',
	'duration-75',
];

const outlinedClasses = [
	'rounded',
	'px-8',
	'py-2',
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
];

const InputButton = ({
	id,
	name,
	type = 'button',
	value = '',
	className = '',
	outlined = false,
}: InputButtonProps) => {
	const classes = outlined ? outlinedClasses : defaultClasses;

	return (
		<input
			className={classes.join(' ').concat(className?.length > 0 ? ' ' + className : '')}
			type={type}
			id={id}
			name={name}
			value={value}
		/>
	);
};

export default InputButton;

import * as React from 'react';
import Select from 'react-select';

interface SelectBoxProps {
	id: string;
	name: string;
	label: string;
	additionalLabelClasses?: string;
	className?: string;
	error?: string | null;
	isMulti?: boolean;
	[x: string]: any;
}

const SelectBox: React.FC<SelectBoxProps> = ({
	id,
	label,
	name,
	className = undefined,
	additionalLabelClasses = undefined,
	error = null,
	isMulti = false,
	...rest
}) => {
	const customStyles = {
		control: (base: any, state: any) => ({
			...base,
			boxShadow: 'none',
			lineHeight: '1.45rem',
			fontSize: '1rem',
			paddingVertical: '0.5rem',
			paddingHorizontal: '0.75rem',
			minHeight: '42px',
			borderRadius: '0.25rem',
			backgroundColor: state.isFocused
				? 'rgba(255, 255, 255, var(--tw-bg-opacity))'
				: 'rgba(243, 244, 246, var(--tw-bg-opacity))',
			borderColor: state.isFocused
				? 'var(--color-primary)'
				: error != null && error?.length > 0
				? 'red'
				: '#ddd',
			transitionDuration: '75ms',
			'&:hover': {
				borderColor: state.isFocused
					? 'var(--color-primary)'
					: error != null && error?.length > 0
					? 'red'
					: '#ddd',
			},
		}),
	};

	const renderSelect = () => {
		if (isMulti) {
			return (
				<Select
					isMulti
					id={id}
					name={name}
					className="basic-multi-select"
					classNamePrefix="select"
					styles={customStyles}
					theme={(theme) => ({
						...theme,
						colors: {
							...theme.colors,
							primary25: 'rgba(243, 244, 246, var(--tw-bg-opacity))',
							primary75: 'var(--color-primary-75)',
							primary50: 'var(--color-primary-50)',
							primary: 'var(--color-primary)',
						},
					})}
					{...rest}
				/>
			);
		}

		return (
			<Select
				id={id}
				name={name}
				styles={customStyles}
				theme={(theme) => ({
					...theme,
					colors: {
						...theme.colors,
						primary25: 'rgba(243, 244, 246, var(--tw-bg-opacity))',
						primary75: 'var(--color-primary-75)',
						primary50: 'var(--color-primary-50)',
						primary: 'var(--color-primary)',
					},
				})}
				{...rest}
			/>
		);
	};

	return (
		<div className={className}>
			<label
				htmlFor={id}
				className={'block mb-1'.concat(
					additionalLabelClasses != null && additionalLabelClasses?.length > 0
						? ' ' + additionalLabelClasses
						: ''
				)}>
				{label}:
			</label>
			<div className="block">
				{renderSelect()}
				{error != null && error?.length > 0 && <span className="mt-1 text-red-500">{error}</span>}
			</div>
		</div>
	);
};

export default SelectBox;

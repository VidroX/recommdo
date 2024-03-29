import * as React from 'react';
import styles from '../../styles/spinner.module.css';
import { ImSpinner10 } from 'react-icons/im';

interface SpinnerProps {
	size?: number;
	overlayMode?: boolean;
	overlayColor?: string;
	spinnerColor?: string;
	className?: string;
	description?: string | null;
}

const Spinner = ({
	size = 24,
	overlayMode = false,
	overlayColor = 'rgba(0,0,0,0.25)',
	spinnerColor = 'var(--color-primary)',
	className = '',
	description = null,
}: SpinnerProps) => {
	if (overlayMode) {
		return (
			<div
				style={{ backgroundColor: overlayColor, color: spinnerColor }}
				className={'flex min-h-full justify-center items-center flex-col '.concat(
					styles.absoluteOverlay
				)}>
				<ImSpinner10
					size={size}
					color={spinnerColor}
					className={'animate-spin'.concat(className?.length > 0 ? ' ' + className : '')}
				/>
				{description != null && <p className="mt-2 text-center">{description}</p>}
			</div>
		);
	}

	return (
		<>
			<ImSpinner10
				size={size}
				color={spinnerColor}
				className={'animate-spin'.concat(className?.length > 0 ? ' ' + className : '')}
			/>
			{description != null && <p className="mt-2 text-center">{description}</p>}
		</>
	);
};

export default Spinner;

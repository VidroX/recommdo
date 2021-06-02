import * as React from 'react';
import IconButtonWrapper from './IconButtonWrapper';
import { VscClose } from 'react-icons/vsc';

interface FileProps {
	name: string;
	onRemove?: (name: string) => void;
	className?: string;
}

const FileButton: React.FC<FileProps> = ({
	name = '',
	onRemove = (name) => {},
	className = undefined,
}) => {
	return (
		<div className="flex flex-row items-center">
			<span className="mr-2 select-none cursor-default">{name}</span>
			<IconButtonWrapper
				size={24}
				color="red-300"
				extraClasses={className}
				onClick={() => {
					if (onRemove) {
						onRemove(name);
					}
				}}>
				<VscClose size={18} />
			</IconButtonWrapper>
		</div>
	);
};

export default FileButton;

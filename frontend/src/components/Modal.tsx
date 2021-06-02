import * as React from 'react';
import { motion } from 'framer-motion';
import Button from './buttons/Button';

export interface ModalButton {
	type: 'confirm' | 'cancel';
	buttonStyle: 'primary' | 'danger';
	outlined?: boolean;
	loading?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	dense?: boolean;
	icon?: React.ReactChild;
	title: string;
}

interface ModalProps {
	isShown: boolean;
	onClose?: () => void;
	onConfirm?: () => void;
	buttons?: ModalButton[];
	title?: string;
}

const Modal: React.FC<ModalProps> = ({
	isShown = false,
	title = undefined,
	onClose = () => {},
	onConfirm = () => {},
	buttons = [],
	children,
}) => {
	return (
		<div
			className={'absolute inset-0 bg-overlay z-50' + (isShown ? '' : ' hidden')}
			onClick={onClose}>
			<div className="h-full flex flex-row items-center">
				<motion.div
					animate={{ opacity: isShown ? 1 : 0 }}
					transition={{
						delay: 0.1,
						default: { duration: 0.2 },
					}}
					className={
						'max-w-full min-w-full rounded-none md:rounded md:min-w-450 md:max-w-450 mx-auto bg-white shadow-md p-4' +
						(isShown ? ' opacity-100' : ' opacity-0')
					}
					onClick={(e) => {
						e.stopPropagation();
					}}>
					{title != undefined && (
						<div className="flex flex-1 justify-center items-center text-center font-semibold text-primary mb-6">
							{title}
						</div>
					)}
					{children}
					<div className="flex flex-1 flex-col-reverse xs:flex-row md:flex-row mt-6 justify-end">
						{buttons?.map((btnInfo, index) => (
							<Button
								key={'modal-button-' + index}
								disabled={btnInfo.disabled}
								extraClasses={
									buttons != null && buttons.length != 0 && index < buttons.length - 1
										? 'mr-0 mt-2 xs:mr-2 xs:mt-0 md:mr-2 md:mt-0'
										: ''
								}
								onClick={() => {
									if (btnInfo.onClick) {
										btnInfo.onClick();
									}
									if (btnInfo.type === 'confirm') {
										if (onConfirm) {
											onConfirm();
										}
									} else {
										if (onClose) {
											onClose();
										}
									}
								}}
								dense={btnInfo.dense}
								buttonType={btnInfo.buttonStyle}
								outlined={btnInfo.outlined != undefined ? btnInfo.outlined : false}
								loading={btnInfo.loading != undefined ? btnInfo.loading : false}
								title={btnInfo.title}>
								{!btnInfo.loading && btnInfo.icon != undefined && btnInfo.icon}{' '}
								<span className="flex">{btnInfo.title}</span>
							</Button>
						))}
					</div>
				</motion.div>
			</div>
		</div>
	);
};

export default Modal;

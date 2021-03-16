import * as React from 'react';
import { config } from '../../config';
import styles from '../../../styles/layout.module.css';

interface NavigationBarProps {
	selectedItem?: string;
}

const NavigationBar = ({ selectedItem = '' }: NavigationBarProps) => {
	return (
		<header className="grid grid-cols-1 mb-4">
			<nav className="md:container md:mx-auto py-3 flex flex-row">
				<div className={'mr-4 font-bold text-primary'.concat(' ' + styles.logo)}>
					{config.general.appName}
				</div>
				123
			</nav>
		</header>
	);
};

export default NavigationBar;

import * as React from 'react';
import { config } from '../../config';
import styles from '../../../styles/layout.module.css';
import Link from '../buttons/Link';
import { useTranslation } from 'next-i18next';

interface NavigationBarProps {
	selectedItem?: string;
}

const NavigationBar = ({ selectedItem = '' }: NavigationBarProps) => {
	const { t } = useTranslation('auth');

	const linkStyles = [
		"hover:border-primary",
		"hover:border-b-2",
		"hover:border-opacity-50",
		"hover:text-primary"
	];

	return (
		<header className="grid grid-cols-1 mb-4">
			<div className="md:container md:mx-auto py-3 flex flex-row px-4">
				<div className={'mr-4 font-bold text-primary py-1' + styles.logo}>
					{config.general.appName}
				</div>
				<nav className="flex flex-1">
					<div className="flex flex-1 justify-start">
						<Link href="#" className={linkStyles.join(' ')}>123</Link>
					</div>
					<div className="flex flex-1 justify-end">
						<Link href="/admin/logout/" className={linkStyles.join(' ')}>{t('logout')}</Link>
					</div>
				</nav>
			</div>
		</header>
	);
};

export default NavigationBar;

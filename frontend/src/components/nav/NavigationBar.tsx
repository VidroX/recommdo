import * as React from 'react';
import { config } from '../../config';
import Link from '../buttons/Link';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { IoLogOutOutline } from 'react-icons/io5';
import { RiMenu4Fill, RiCloseFill, RiSettings4Fill } from 'react-icons/ri';
import { GrProjects } from 'react-icons/gr';

const NavigationBar = () => {
	const { t } = useTranslation('common');

	const { route, locale, defaultLocale } = useRouter();

	const [currentLocale] = useState(locale ?? defaultLocale);
	const [navShown, setNavShown] = useState(false);

	const linkStyles = [
		'hover:bg-gray-200',
		'duration-100',
		'rounded-b',
		'p-4',
		'flex',
		'flex-row',
		'justify-center',
		'items-center',
		'h-full',
	].join(' ');

	const selectedLinkStyles = [
		'bg-gray-200',
		'rounded-b',
		'p-4',
		'flex',
		'flex-row',
		'justify-center',
		'items-center',
		'h-full',
	].join(' ');

	const shownNavStyles = 'w-full md:w-auto rounded-t md:rounded-t-none';

	const toggleNavBar = () => {
		setNavShown((shown) => !shown);
	};

	return (
		<header className="md:mx-auto max-w-7xl w-full flex flex-row px-4 mb-4">
			<nav className="flex flex-col md:flex-row flex-1">
				<div className="flex flex-row flex-1 md:flex-none">
					<Link href="/" locale={currentLocale} className="font-bold text-primary py-4 pr-2 mr-4">
						{config.general.appName}
					</Link>
					<div className="md:hidden flex flex-1 justify-end items-center">
						<button className={linkStyles + ' focus:outline-none border-0'} onClick={toggleNavBar}>
							{!navShown ? <RiMenu4Fill size={20} /> : <RiCloseFill size={20} />}
						</button>
					</div>
				</div>
				<div
					className={
						navShown
							? 'flex flex-col md:flex-row md:flex-1 duration-300'
							: 'hidden md:flex md:flex-row md:flex-1 duration-300'
					}>
					<ul className="flex flex-col md:flex-row md:flex-1">
						<li className="flex mt-2 md:mt-0 md:mr-2">
							<Link
								href="/"
								className={(route === '/' ? selectedLinkStyles : linkStyles) + ' ' + shownNavStyles}
								locale={currentLocale}>
								<GrProjects size={20} className="mr-2" /> {t('projectsTitle')}
							</Link>
						</li>
					</ul>
					<ul className="flex flex-col md:flex-row">
						<li className="flex mt-1 md:mt-0 md:mr-2">
							<Link
								href="/admin/settings/"
								className={(route === '/admin/settings' ? selectedLinkStyles : linkStyles) + ' ' + shownNavStyles}
								locale={currentLocale}>
								<RiSettings4Fill size={20} className="mr-1" /><span className="md:hidden">{' '}{t('settingsTitle')}</span>
							</Link>
						</li>
						<li className="flex mt-1 md:mt-0">
							<Link
								href="/admin/logout/"
								className={linkStyles + ' ' + shownNavStyles}
								locale={currentLocale}>
								<IoLogOutOutline size={20} className="mr-1" /> <span>{t('logout')}</span>
							</Link>
						</li>
					</ul>
				</div>
			</nav>
		</header>
	);
};

export default NavigationBar;

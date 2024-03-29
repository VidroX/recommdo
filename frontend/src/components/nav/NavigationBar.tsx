import * as React from 'react';
import { config } from '../../config';
import Link from '../buttons/Link';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { IoLogOutOutline } from 'react-icons/io5';
import { RiMenu4Fill, RiCloseFill } from 'react-icons/ri';
import { AiOutlineFundProjectionScreen } from 'react-icons/ai';
import { FaUserCircle, FaUsers } from 'react-icons/fa';
import useUser from '../../hooks/useUser';

const NavigationBar = () => {
	const { t } = useTranslation('common');

	const { route, locale, defaultLocale } = useRouter();

	const user = useUser();

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
								title={t('projectsTitle')}
								href="/"
								className={(route === '/' ? selectedLinkStyles : linkStyles) + ' ' + shownNavStyles}
								locale={currentLocale}>
								<AiOutlineFundProjectionScreen size={20} className="mr-2" /> {t('projectsTitle')}
							</Link>
						</li>
						{user?.accessLevel.isStaff && (
							<li className="flex mt-2 md:mt-0 md:mr-2">
								<Link
									title={t('users')}
									href="/users/"
									className={
										(route === '/users' ? selectedLinkStyles : linkStyles) + ' ' + shownNavStyles
									}
									locale={currentLocale}>
									<FaUsers size={20} className="mr-2" /> {t('users')}
								</Link>
							</li>
						)}
					</ul>
					<ul className="flex flex-col md:flex-row">
						<li className="flex mr-0 md:mr-2 mt-1 md:mt-0">
							<Link
								title={t('user')}
								href={{
									pathname: '/users/[uid]/',
									query: {
										uid: user?.id
									}
								}}
								className={
									(route === '/users/[uid]' ? selectedLinkStyles : linkStyles) + ' ' + shownNavStyles
								}
								locale={currentLocale}>
								<FaUserCircle size={20} className="mr-2 md:mr-0" />
								<span className="flex md:hidden">{t('user')}</span>
							</Link>
						</li>
						<li className="flex mt-1 md:mt-0">
							<Link
								title={t('logout')}
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

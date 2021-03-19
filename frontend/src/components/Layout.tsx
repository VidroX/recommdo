import * as React from 'react';
import NavigationBar from './nav/NavigationBar';
import Head from 'next/head';
import { config } from '../config';
import { useTranslation } from 'next-i18next';
import { GoogleFonts } from 'next-google-fonts';

interface DefaultLayoutProps {
	pageName?: string;
	showNavbar?: boolean;
	showFooter?: boolean;
	backgroundColor?: string;
	fullHeight?: boolean;
}

const Layout: React.FC<DefaultLayoutProps> = ({
	backgroundColor = null,
	pageName = '',
	showNavbar = true,
	showFooter = true,
	fullHeight = false,
	children,
}) => {
	const { t } = useTranslation('common');

	const customStyles = `
		html,
		body,
    div#__next {
			${fullHeight ? 'height: 100%;' : ''}
		}
		${backgroundColor != null ? 'body { background: ' + backgroundColor + '; }' : ''}
	`;

	return (
		<>
			<GoogleFonts href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700;800&display=swap" />
			<Head>
				<title>
					{pageName?.length > 0
						? pageName + ' - ' + config.general.appName
						: config.general.appName}
				</title>
				<style>{customStyles}</style>
				<meta name="viewport" content="initial-scale=1.0, width=device-width" />
			</Head>
			{showNavbar && <NavigationBar />}
			<main className={'grid grid-cols-1'.concat(fullHeight ? ' h-full' : '')}>
				<div className="md:mx-auto max-w-7xl w-full px-4">{children}</div>
			</main>
			{showFooter && (
				<footer className="grid grid-cols-1 mt-4">
					<div className="md:mx-auto max-w-7xl w-full px-4">
						&copy; {config.general.appName}, {new Date().getFullYear()}. {t('rightsReserved')}.
					</div>
				</footer>
			)}
		</>
	);
};

export default Layout;

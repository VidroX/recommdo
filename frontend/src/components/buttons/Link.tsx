import * as React from 'react';
import NavLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface CustomLinkProps {
	href?: string;
	className?: string;
	locale?: string;
}

const Link: React.FC<CustomLinkProps> = ({
	locale = null,
	href = '#',
	className = '',
	children,
}) => {
	const { locale: routerLocale, defaultLocale } = useRouter();

	const [linkLocale] = useState(
		locale != null ? locale : routerLocale == null ? defaultLocale : routerLocale
	);

	return (
		<NavLink href={href} locale={linkLocale}>
			<a className={className}>{children}</a>
		</NavLink>
	);
};

export default Link;

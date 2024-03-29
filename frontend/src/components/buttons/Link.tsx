import * as React from 'react';
import NavLink from 'next/link';
import { useRouter } from 'next/router';
import { CSSProperties, useState } from 'react';
import { UrlObject } from 'url';

interface CustomLinkProps {
	href?: string | UrlObject;
	className?: string;
	disabled?: boolean;
	locale?: string;
	title?: string;
	style?: CSSProperties;
}

const Link: React.FC<CustomLinkProps> = ({
	disabled = false,
	locale = null,
	href = '#',
	className = '',
	children,
	title = undefined,
	style = undefined,
}) => {
	const { locale: routerLocale, defaultLocale } = useRouter();

	const [linkLocale] = useState(
		locale != null ? locale : routerLocale == null ? defaultLocale : routerLocale
	);

	if (disabled) {
		return (
			<span style={style} className={className} title={title}>
				{children}
			</span>
		);
	}

	return (
		<NavLink href={href} locale={linkLocale}>
			<a style={style} title={title} className={className}>
				{children}
			</a>
		</NavLink>
	);
};

export default Link;

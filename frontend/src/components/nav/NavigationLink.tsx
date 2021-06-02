import * as React from 'react';
import Link, { LinkProps } from 'next/link';

const NavigationLink = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
	const { as, href, locale, ...rest } = props;

	return (
		<Link href={href} as={as} locale={locale}>
			{/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
			<a ref={ref} {...rest} />
		</Link>
	);
});

NavigationLink.displayName = 'NavigationLink';

export default NavigationLink;

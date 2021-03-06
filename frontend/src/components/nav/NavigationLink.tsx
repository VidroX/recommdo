import * as React from "react";
import Link, {LinkProps} from "next/link";

const NavigationLink = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { as, href, locale, ...rest } = props;

  return (
    <Link href={href} as={as} locale={locale}>
      <a ref={ref} {...rest} />
    </Link>
  );
});

export default NavigationLink;
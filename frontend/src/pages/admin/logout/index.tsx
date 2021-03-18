import * as React from 'react';
import { useEffect, useState } from 'react';
import { config } from '../../../config';
import { useRouter } from 'next/router';

const LogoutPage = () => {
	const { route, push, locale, defaultLocale } = useRouter();

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			route != null &&
			route?.length > 0 &&
			(locale != null || defaultLocale != null)
		) {
			const token = localStorage?.getItem(config.api.authTokenLocation);
			if (token != null) {
				localStorage.removeItem(config.api.authTokenLocation);
				localStorage.removeItem(config.api.refreshTokenLocation);
			}

			push('/admin/login/', '/admin/login/', { locale: locale ?? defaultLocale }).catch((e) => {
				console.error('Unable to redirect to main page', e);
			});
		}
	}, [route, locale, defaultLocale]);

	return null;
};

export default LogoutPage;

import { isAfter } from 'date-fns';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { REFRESH_TOKEN_MUTATION } from '../apollo/mutations/auth';
import { ApolloClient } from '@apollo/client';

export const TOKEN_TYPES = {
	ALL: 'all',
	ACCESS: 'access',
	REFRESH: 'refresh',
};

export const getNewAccessToken = (
	apolloClient: ApolloClient<any>,
	oldHeaders: Record<string, any> | null = null
) => {
	const refreshToken = getUserToken(TOKEN_TYPES.REFRESH);

	if (!checkTokenValidity(TOKEN_TYPES.REFRESH, refreshToken)) {
		return null;
	}

	let headers: any = {
		Authorization: `Bearer ${refreshToken}`,
	};

	if (oldHeaders != null) {
		headers = {
			...oldHeaders,
			Authorization: `Bearer ${refreshToken}`,
		};
	}

	return apolloClient
		.mutate({
			mutation: REFRESH_TOKEN_MUTATION,
			context: {
				headers,
			},
		})
		.then((response) => {
			const {
				refresh: {
					tokens: { accessToken },
				},
			} = response.data;

			setAccessToken(accessToken);

			return accessToken;
		});
};

export const removeUserToken = (type = TOKEN_TYPES.ALL) => {
	if (typeof window === 'undefined') {
		return;
	}

	switch (type) {
		case TOKEN_TYPES.ACCESS:
			localStorage.removeItem(config.api.authTokenLocation);
			break;
		case TOKEN_TYPES.REFRESH:
			localStorage.removeItem(config.api.refreshTokenLocation);
			break;
		default:
			localStorage.removeItem(config.api.authTokenLocation);
			localStorage.removeItem(config.api.refreshTokenLocation);
			break;
	}
};

export const getUserToken = (type = TOKEN_TYPES.ACCESS) => {
	if (typeof window === 'undefined') {
		return null;
	}

	switch (type) {
		case TOKEN_TYPES.REFRESH:
			return localStorage?.getItem(config.api.refreshTokenLocation);
		default:
			return localStorage?.getItem(config.api.authTokenLocation);
	}
};

export const setAccessToken = (token: string) => {
	if (typeof window === 'undefined') {
		return null;
	}

	localStorage.setItem(config.api.authTokenLocation, token);
};

export const setRefreshToken = (token: string) => {
	if (typeof window === 'undefined') {
		return null;
	}

	localStorage.setItem(config.api.refreshTokenLocation, token);
};

export const checkTokenValidity = (
	type = TOKEN_TYPES.ACCESS,
	userToken: string | null = null
): boolean => {
	let token;

	if (userToken == null) {
		token = getUserToken(type);
	} else {
		token = userToken;
	}

	if (token == null) {
		return false;
	}

	const decodedToken: any = jwt?.decode(token);

	if (decodedToken == null) {
		return false;
	}

	return (
		decodedToken?.type != null &&
		decodedToken.type === type &&
		decodedToken?.exp != null &&
		!isAfter(new Date(), new Date(decodedToken.exp * 1000))
	);
};

export const checkUserTokens = (): boolean => {
	if (typeof window === 'undefined') {
		return false;
	}

	let allTokensCorrect = true;

	if (!checkTokenValidity(TOKEN_TYPES.ACCESS)) {
		removeUserToken(TOKEN_TYPES.ACCESS);

		allTokensCorrect = false;
	}

	if (!checkTokenValidity(TOKEN_TYPES.REFRESH)) {
		removeUserToken(TOKEN_TYPES.REFRESH);

		allTokensCorrect = false;
	}

	return allTokensCorrect;
};

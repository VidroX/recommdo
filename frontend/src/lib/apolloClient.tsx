import { useMemo } from 'react';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { config } from '../config';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import {
	checkTokenValidity,
	checkUserTokens,
	getNewAccessToken,
	getUserToken,
	TOKEN_TYPES,
} from '../utils/userUtils';
import { createUploadLink } from 'apollo-upload-client';

let apolloClient: ApolloClient<any>;

const uploadLink = createUploadLink({
	uri: config.api.url,
});

const authLink = setContext((_, { headers }) => {
	const accessToken = getUserToken(TOKEN_TYPES.ACCESS);
	const refreshToken = getUserToken(TOKEN_TYPES.REFRESH);

	if (accessToken == null && refreshToken == null) {
		return {
			headers: {
				...headers,
			},
		};
	}

	return {
		headers: {
			...headers,
			Authorization: accessToken
				? `Bearer ${accessToken}`
				: refreshToken
				? `Bearer ${refreshToken}`
				: '',
		},
	};
});

const errorLink = onError(({ operation, graphQLErrors, forward }) => {
	if (graphQLErrors) {
		for (const err of graphQLErrors) {
			if (
				err?.extensions?.code != null &&
				err.extensions.code >= 1 &&
				err.extensions.code <= 5 &&
				checkTokenValidity(TOKEN_TYPES.REFRESH)
			) {
				const oldHeaders = operation.getContext().headers;
				const accessToken = getNewAccessToken(apolloClient, oldHeaders);

				if (accessToken != null) {
					operation.setContext({
						headers: {
							...oldHeaders,
							Authorization: `Bearer ${accessToken}`,
						},
					});

					return forward(operation);
				}
			} else {
				checkUserTokens();
			}
		}

		if (config.general.isDev) {
			graphQLErrors.map(({ message, locations, path, extensions }) =>
				console.log(
					`[GraphQL error]: Code: ${extensions?.code}, Message: ${message}, Location: ${locations}, Path: ${path}`
				)
			);
		}
	}
});

const createApolloClient = (): ApolloClient<any> => {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		link: ApolloLink.from([errorLink, authLink, uploadLink]),
		cache: new InMemoryCache(),
	});
};

export const initializeApollo = (initialState: any = null): ApolloClient<any> => {
	const _apolloClient = apolloClient ?? createApolloClient();

	if (initialState) {
		const existingCache = _apolloClient.extract();

		_apolloClient.cache.restore({ ...existingCache, ...initialState });
	}

	if (typeof window === 'undefined') {
		return _apolloClient;
	}

	if (!apolloClient) {
		apolloClient = _apolloClient;
	}

	return _apolloClient;
};

export const useApollo = (initialState: any): ApolloClient<any> => {
	return useMemo(() => initializeApollo(initialState), [initialState]);
};

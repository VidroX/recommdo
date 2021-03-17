import { useMemo } from 'react';
import { ApolloClient, ApolloLink, createHttpLink, InMemoryCache } from '@apollo/client';
import { config } from '../config';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

let apolloClient: ApolloClient<any>;

const httpLink = createHttpLink({
	uri: config.api.url,
});

const authLink = setContext((_, { headers }) => {
	const token = localStorage.getItem(config.api.authTokenLocation);

	return {
		headers: {
			...headers,
			authorization: token ? `Bearer ${token}` : '',
		},
	};
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
	if (graphQLErrors && config.general.isDev) {
		graphQLErrors.map(({ message, locations, path, extensions }) =>
			console.log(
				`[GraphQL error]: Code: ${extensions?.code}, Message: ${message}, Location: ${locations}, Path: ${path}`
			)
		);
	}
});

const createApolloClient = (): ApolloClient<any> => {
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: ApolloLink.from([errorLink, authLink, httpLink]),
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

export const useApollo = (initialState: any): any => {
	return useMemo(() => initializeApollo(initialState), [initialState]);
};

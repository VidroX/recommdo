import '../../styles/globals.css';
import 'rsuite/dist/styles/rsuite-default.css';

import * as React from 'react';
import {AppProps} from "next/app";
import {appWithTranslation} from "next-i18next";
import {useApollo} from "../lib/apolloClient";
import {ApolloProvider} from "@apollo/client";

function Application({ Component, pageProps }: AppProps) {
  const apolloClient = useApollo(pageProps.initialApolloState);

  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}

export default appWithTranslation(Application);

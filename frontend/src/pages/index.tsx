import * as React from 'react';
import Head from 'next/head';
import {serverSideTranslations} from "next-i18next/serverSideTranslations";
import {GetStaticProps} from "next";
import { config } from '../config';
import {useTranslation} from "next-i18next";
import NavigationBar from "../components/nav/NavigationBar";
import {gql, useQuery} from "@apollo/client";
import {useEffect} from "react";

export const ALL_USERS_QUERY = gql`
    query users {
        users {
            firstName
        }
    }
`;

const Home = () => {
  const { t } = useTranslation('common');

  const { loading, error, data } = useQuery(ALL_USERS_QUERY);

  useEffect(() => {
    console.log(loading, error);
    if (!loading && !error && data != null) {
      console.log(data);
    }
  }, [loading, error, data]);

  return (
    <div>
      <Head>
        <title>Recommdo</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavigationBar />

      <main>
        {t('test')}
      </main>
    </div>
  )
};

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...await serverSideTranslations(locale ?? config.i18n.defaultLocale, ['common']),
  },
})

export default Home;
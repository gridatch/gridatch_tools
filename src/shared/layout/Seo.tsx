/**
 * SEO component that queries for data with
 * Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.com/docs/how-to/querying-data/use-static-query/
 */

import * as React from 'react';

import { graphql, useStaticQuery } from 'gatsby';

interface SeoProps {
  description?: string;
  title?: string;
  children?: React.ReactNode;
}

const Seo: React.FC<SeoProps> = ({ description, title, children }) => {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
          }
        }
      }
    `,
  );

  const metaDescription = description || site.siteMetadata.description;
  const defaultTitle = site.siteMetadata?.title;

  return (
    <>
      <title>{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content={site.siteMetadata?.author || ``} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <link rel="apple-touch-icon" sizes="48x48" href="/icons/apple-touch-icon-48x48.png" />
      <link rel="apple-touch-icon" sizes="72x72" href="/icons/apple-touch-icon-72x72.png" />
      <link rel="apple-touch-icon" sizes="96x96" href="/icons/apple-touch-icon-96x96.png" />
      <link rel="apple-touch-icon" sizes="144x144" href="/icons/apple-touch-icon-144x144.png" />
      <link rel="apple-touch-icon" sizes="192x192" href="/icons/apple-touch-icon-192x192.png" />
      <link rel="apple-touch-icon" sizes="256x256" href="/icons/apple-touch-icon-256x256.png" />
      <link rel="apple-touch-icon" sizes="384x384" href="/icons/apple-touch-icon-384x384.png" />
      <link rel="apple-touch-icon" sizes="512x512" href="/icons/apple-touch-icon-512x512.png" />
      {children}
    </>
  );
};

export default Seo;

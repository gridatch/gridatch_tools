/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    title: `わがつまだっちのツール`,
    description: `雀魂の青雲の志攻略用ツールなどを公開しているサイト`,
    author: `gridatch`,
    siteUrl: `https://gridatch.com/`,
  },
  plugins: [
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `わがつまだっちのツール`,
        short_name: `だっちのツール`,
        start_url: `/`,
        background_color: `#fef7e5`,
        // This will impact how browsers show your PWA/website
        // https://css-tricks.com/meta-theme-color-and-trickery/
        theme_color: `#887c60`,
        display: `standalone`,
        icon: `src/images/icon.png`, // This path is relative to the root of the site.
        orientation: `portrait`,
      },
    },
    {
      // happy css modules のため
      resolve: `gatsby-plugin-postcss`,
      options: {
        cssLoaderOptions: {
          esModule: false,
          modules: {
            namedExport: false,
          },
        },
      },
    },
    'gatsby-plugin-offline',
    `gatsby-plugin-typescript`,
  ],
}

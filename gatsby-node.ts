import { GatsbyNode } from "gatsby";

/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */

export const onCreateWebpackConfig: GatsbyNode["onCreateWebpackConfig"] = ({
  actions,
  getConfig,
}) => {
  const config = getConfig();

  config.output.environment = {
    ...config.output.environment,
    asyncFunction: true,
  };

  config.resolve = {
    ...config.resolve,
    fallback: {
      ...((config.resolve?.fallback) || {}),
      fs: false,
      path: false,
      crypto: false,
    },
  };

  // 置き換え
  actions.replaceWebpackConfig(config);
};
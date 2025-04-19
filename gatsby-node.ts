
import { GatsbyNode } from 'gatsby';


/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */

export const onCreateWebpackConfig: GatsbyNode['onCreateWebpackConfig'] = ({ actions, getConfig }) => {
  const config = getConfig();
  config.output.environment = {
    ...config.output.environment,
    asyncFunction: true,
  };
  actions.replaceWebpackConfig(config);
};

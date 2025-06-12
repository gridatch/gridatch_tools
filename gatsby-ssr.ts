/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-ssr/
 */
import type { GatsbySSR } from "gatsby";

import { wrapRootElement as wrap } from "./src/app/wrapRootElement";

export const wrapRootElement: GatsbySSR["wrapRootElement"] = wrap;

export const onRenderBody: GatsbySSR["onRenderBody"] = ({ setHtmlAttributes }) => {
  setHtmlAttributes({ lang: "ja" });
};

/**
 * Implement Gatsby's Browser APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-browser/
 */
import { GatsbyBrowser } from "gatsby";

import { wrapRootElement as wrap } from "./src/app/wrapRootElement";

export const wrapRootElement: GatsbyBrowser["wrapRootElement"] = wrap;
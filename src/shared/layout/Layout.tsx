/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/how-to/querying-data/use-static-query/
 */
import "./Layout.css"

import * as React from "react"

import { useStaticQuery, graphql } from "gatsby"

import ProcessingModal from "@shared/processing/components/ProcessingModal";

import Header from "./Header"

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
      <ProcessingModal />
      <main>{children}</main>
    </>
  )
}

export default Layout

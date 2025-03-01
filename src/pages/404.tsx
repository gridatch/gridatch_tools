import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import { PageProps } from "gatsby"

const NotFoundPage: React.FC<PageProps> = () => (
  <Layout>
    <h1>404: Not Found</h1>
    <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
  </Layout>
)

export const Head: React.FC = () => <Seo title="404: Not Found" />

export default NotFoundPage

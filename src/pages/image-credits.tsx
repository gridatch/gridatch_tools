import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import DynamicSVGText from "../components/dynamicSVGText"
import DynamicSVGTextSequence from "../components/dynamicSVGTextSequence"
import { PageProps } from "gatsby"

const ImageCreditsPage: React.FC<PageProps> = () => (
  <Layout>
    <h2><DynamicSVGText text={"引用元情報"} /></h2>
    <section style={{maxWidth: 680}}>
      <h3><DynamicSVGText text={"雀魂 -じゃんたま-"} /></h3>
      <p><a href="https://mahjongsoul.com/"><DynamicSVGText text={"https://mahjongsoul.com/"} /></a></p>
      <p><DynamicSVGTextSequence text={"引用した画像の著作権は、「雀魂 -じゃんたま-」の運営者および各権利の保有者に帰属しております。"}/></p>
    </section>
  </Layout>
)

export const Head: React.FC = () => <Seo title="引用元情報" />

export default ImageCreditsPage

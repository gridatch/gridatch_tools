import * as React from "react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import DynamicSVGText from "../components/dynamicSVGText"
import DynamicSVGTextSequence from "../components/dynamicSVGTextSequence"
import { PageProps } from "gatsby"

const history = [
  {
    version: "1.0",
    messages: [
      "万万シミュレーターリリース。"
    ]
  },
  {
    version: "1.1",
    messages: [
      "横長レイアウトに対応しました。"
    ]
  },
  {
    version: "2.0",
    messages: [
      "索子多面張シミュレーターリリース。"
    ]
  },
];

const ImageCreditsPage: React.FC<PageProps> = () => (
  <Layout>
    <h2 style={{marginBottom: "3rem"}}><DynamicSVGText text={"更新履歴"} /></h2>
    <div style={{width: "100%", display: "flex", flexDirection: "column-reverse", gap: "10px", alignItems: "center"}}>
      {
        history.map((revision) => (
          <section key={revision.version} style={{width: "100%", maxWidth: 680}}>
            <h4><DynamicSVGText text={revision.version} /></h4>
            {
              revision.messages.map((message, i) => (
                <p key={`${revision.version}_${i}`}><DynamicSVGTextSequence text={message}/></p>
              ))
            }
          </section>
        ))
      }
    </div>
  </Layout>
)

export const Head: React.FC = () => <Seo title="更新履歴" />

export default ImageCreditsPage

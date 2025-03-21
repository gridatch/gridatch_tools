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
  {
    version: "3.0",
    messages: [
      "領域牌表示ツール（旧：領域牌シミュレーター）リリース。"
    ]
  },
  {
    version: "3.1",
    messages: [
      "各シミュレーターにリセットボタンを追加しました。"
    ]
  },
  {
    version: "4.0",
    messages: [
      "領域和了シミュレーターリリース。"
    ]
  },
  {
    version: "4.1",
    messages: [
      "領域和了シミュレーターが想定より高速だったため、ツモ候補や打牌候補を操作するたびに最終形を更新するよう改善しました。"
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

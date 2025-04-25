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
      "万万シミュレーターリリース。",
    ]
  },
  {
    version: "1.1",
    messages: [
      "横長レイアウトに対応しました。",
    ]
  },
  {
    version: "2.0",
    messages: [
      "索子多面張シミュレーターリリース。",
    ]
  },
  {
    version: "3.0",
    messages: [
      "領域牌表示ツール（旧：領域牌シミュレーター）リリース。",
    ]
  },
  {
    version: "3.1",
    messages: [
      "各シミュレーターにリセットボタンを追加しました。",
    ]
  },
  {
    version: "4.0",
    messages: [
      "領域和了シミュレーターリリース。",
    ]
  },
  {
    version: "4.1",
    messages: [
      "領域和了シミュレーターが想定より高速だったため、ツモ候補や打牌候補を操作するたびに最終形を更新するよう改善しました。",
    ]
  },
  {
    version: "4.2",
    messages: [
      "領域和了シミュレーターに場の修正ボタンを追加しました。",
    ]
  },
  {
    version: "4.3",
    messages: [
      "領域和了シミュレーターに「1手戻る」「1手進む」ボタンを追加しました。",
    ]
  },
  {
    version: "4.4",
    messages: [
      "領域和了シミュレーターに入替終了後のツモ・打牌と打牌アシストを実装しました。",
      "領域和了シミュレーターの和了数に裏牌による和了の期待値を加算しました。",
      "万万/索子多面張シミュレーターに牌山から手牌にツモるボタンを追加しました。",
    ]
  },
  {
    version: "4.5",
    messages: [
      "領域和了シミュレーターに「入れ替え最大3枚」、「ロック」のステージ効果を実装しました。",
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
            <h4><DynamicSVGTextSequence text={revision.version} /></h4>
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

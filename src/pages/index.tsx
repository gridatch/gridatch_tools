import * as React from "react"
import { StaticImage } from "gatsby-plugin-image"

import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./index.module.css"
import DynamicSvgText from "../components/dynamicSVGText"
import DynamicSVGTextSequence from "../components/dynamicSVGTextSequence"
import { PageProps } from "gatsby"

const links = [
  {
    text: "万万シミュレーター",
    url: "/manman",
    descriptions:
      [
        "ラブラブ万万編成用の索子多面張を探すツールです。",
        "ロスする索子と萬子の枚数が少ない順に最終形を出力します。"
      ],
  },
];

const footerLinks = [
  {
    text: "更新履歴",
    url: "/history",
  },
  {
    text: "引用元情報",
    url: "/image-credits",
  },
];

const IndexPage: React.FC<PageProps> = () => (
  <Layout>
    <div className={styles.textCenter}>
      <h1 style={{ marginBottom: "3rem" }}>
        <DynamicSvgText text={"わがつまだっちのツール"}/>
      </h1>
    </div>
    <ul className={styles.list}>
      {links.map((link, i) => (
        <li key={i} className={styles.listItem}>
          <a
            className={styles.listItemLink}
            href={link.url}
          >
            <StaticImage
              src="../images/mannin.png"
              width={64}
              quality={95}
              formats={["auto", "webp", "avif"]}
              alt=""
              objectFit="contain"
              style={{ flexShrink: 0, marginRight: 10 }}
            />
            <div>
              <DynamicSvgText text={link.text} />
              <p>
                {link.descriptions.map((description, j) => (
                  <DynamicSVGTextSequence key={j} className={styles.listItemDescription} text={description} />
                ))}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
    <div className={styles.footerLinks}>
      {footerLinks.map((link) => (
        <React.Fragment key={link.url}>
          <a href={`${link.url}`}><DynamicSvgText text={link.text} /></a>
        </React.Fragment>
      ))}
    </div>
  </Layout>
)

/**
 * Head export to define metadata for the page
 *
 * See: https://www.gatsbyjs.com/docs/reference/built-in-components/gatsby-head/
 */
export const Head: React.FC = () => <Seo title="ツール一覧" />

export default IndexPage

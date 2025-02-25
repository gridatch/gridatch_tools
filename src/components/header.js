import * as React from "react"
import { Link } from "gatsby"
import DynamicSVGText from "./dynamicSVGText"

const Header = ({ siteTitle }) => (
  <header
    style={{
      margin: `var(--size-gap) var(--size-gutter)`,
      display: `flex`,
      alignItems: `center`,
      justifyContent: `space-between`,
    }}
  >
    <Link
      to="/"
      style={{
        fontSize: `var(--font-lg)`,
        textDecoration: `none`,
      }}
    >
      <DynamicSVGText text={siteTitle} />
    </Link>
    <span></span>
  </header>
)

export default Header

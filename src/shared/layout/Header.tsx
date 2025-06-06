import * as React from "react"
import { Link } from "gatsby"
import DynamicSVGText from "../ui/DynamicSVGText"

interface HeaderProps {
  siteTitle: string;
}

const Header: React.FC<HeaderProps> = ({ siteTitle }) => (
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
        textDecoration: `none`,
      }}
    >
      <DynamicSVGText text={siteTitle} />
    </Link>
    <span></span>
  </header>
)

export default Header

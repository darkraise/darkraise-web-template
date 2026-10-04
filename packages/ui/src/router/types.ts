import type { ComponentType, CSSProperties, MouseEvent, ReactNode } from "react"

export interface RouterLinkProps {
  to: string
  className?: string
  activeClassName?: string
  activeExact?: boolean
  style?: CSSProperties
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  /**
   * Marks this link as the current page for assistive technology.
   *
   * The kit decides which nav row is current and passes `aria-current="page"`
   * on that link itself, so an adapter must forward this prop onto the anchor
   * and never override it. A router may also mark a link it matches exactly
   * (the kit asks for exact matching with `activeExact`), as TanStack Router
   * does; such a link leads to the current page too.
   */
  "aria-current"?: "page"
}

export interface RouterAdapter {
  Link: ComponentType<RouterLinkProps>
  useNavigate: () => (to: string) => void
  usePathname: () => string
  useBack: () => () => void
  useInvalidate: () => () => void
}

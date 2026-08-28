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
   * The kit's navigation shows the active item with a class, which is a purely
   * visual signal — a screen reader user gets nothing from it. Adapters must
   * therefore put `aria-current="page"` on the active anchor. Routers that
   * already do this (TanStack Router, for one) satisfy it for free as long as
   * the adapter spreads its remaining props onto the anchor; adapters over a
   * router that does not must set it from the same condition that drives
   * `activeClassName`.
   *
   * Passed explicitly where the kit resolves active state itself rather than
   * delegating to the router.
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

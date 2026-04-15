import type { ComponentType, MouseEvent, ReactNode } from "react"

export interface RouterLinkProps {
  to: string
  className?: string
  activeClassName?: string
  activeExact?: boolean
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export interface RouterAdapter {
  Link: ComponentType<RouterLinkProps>
  useNavigate: () => (to: string) => void
  usePathname: () => string
  useBack: () => () => void
  useInvalidate: () => () => void
}

import {
  Link as TanstackLink,
  useNavigate as useTanstackNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router"
import type { RouterAdapter, RouterLinkProps } from "darkraise-ui/router"

function Link({ to, activeClassName, activeExact, ...rest }: RouterLinkProps) {
  return (
    <TanstackLink
      to={to}
      activeOptions={activeExact ? { exact: true } : undefined}
      activeProps={activeClassName ? { className: activeClassName } : undefined}
      {...rest}
    />
  )
}

export const tanstackRouterAdapter: RouterAdapter = {
  Link,
  useNavigate: () => {
    const navigate = useTanstackNavigate()
    return (to: string) => {
      void navigate({ to })
    }
  },
  usePathname: () => useRouterState().location.pathname,
  useBack: () => {
    const router = useRouter()
    return () => router.history.back()
  },
  useInvalidate: () => {
    const router = useRouter()
    return () => {
      void router.invalidate()
    }
  },
}

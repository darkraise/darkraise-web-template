import { createContext, useContext, type ReactNode } from "react"
import type { RouterAdapter, RouterLinkProps } from "./types"

const RouterAdapterContext = createContext<RouterAdapter | null>(null)

interface RouterAdapterProviderProps {
  value: RouterAdapter
  children: ReactNode
}

export function RouterAdapterProvider({
  value,
  children,
}: RouterAdapterProviderProps) {
  return (
    <RouterAdapterContext.Provider value={value}>
      {children}
    </RouterAdapterContext.Provider>
  )
}

export function useRouterAdapter(): RouterAdapter {
  const adapter = useContext(RouterAdapterContext)
  if (adapter === null) {
    throw new Error(
      "useRouterAdapter must be used inside a <RouterAdapterProvider>",
    )
  }
  return adapter
}

// Used by the built-in error pages so they remain functional even when
// rendered outside a RouterAdapterProvider — e.g. when TanStack Router
// mounts `defaultErrorComponent` for a router-init error before the root
// route has rendered.
function StubLink({
  to,
  className,
  style,
  children,
  onClick,
}: RouterLinkProps) {
  return (
    <a
      href={to}
      className={className}
      style={style}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
      }}
    >
      {children}
    </a>
  )
}

const STUB_ADAPTER: RouterAdapter = {
  Link: StubLink,
  useNavigate: () => (to: string) => {
    if (typeof window !== "undefined") window.location.href = to
  },
  usePathname: () =>
    typeof window !== "undefined" ? window.location.pathname : "/",
  useBack: () => () => {
    if (typeof window !== "undefined") window.history.back()
  },
  useInvalidate: () => () => undefined,
}

export function useOptionalRouterAdapter(): RouterAdapter {
  return useContext(RouterAdapterContext) ?? STUB_ADAPTER
}

import { createContext, useContext } from "react"
import type { RouterAdapter } from "./types"
import { StubLink } from "./StubLink"

export const RouterAdapterContext = createContext<RouterAdapter | null>(null)

export function useRouterAdapter(): RouterAdapter {
  const adapter = useContext(RouterAdapterContext)
  if (adapter === null) {
    throw new Error(
      "useRouterAdapter must be used inside a <RouterAdapterProvider>",
    )
  }
  return adapter
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

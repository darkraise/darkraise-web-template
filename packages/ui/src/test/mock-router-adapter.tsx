import { useCallback, useMemo, useState, type ReactNode } from "react"
import { RouterAdapterProvider } from "../router/context"
import type { RouterAdapter, RouterLinkProps } from "../router/types"

interface MockRouterAdapterProviderProps {
  initialPath?: string
  children: ReactNode
}

export function MockRouterAdapterProvider({
  initialPath = "/",
  children,
}: MockRouterAdapterProviderProps) {
  const [history, setHistory] = useState<string[]>([initialPath])
  const pathname = history[history.length - 1] ?? initialPath

  const push = useCallback((to: string) => {
    setHistory((h) => [...h, to])
  }, [])
  const back = useCallback(() => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h))
  }, [])

  const adapter = useMemo<RouterAdapter>(() => {
    function Link({
      to,
      className,
      activeClassName,
      activeExact,
      style,
      children,
      onClick,
    }: RouterLinkProps) {
      const isActive = activeExact ? pathname === to : pathname.startsWith(to)
      const classes = [className, isActive ? activeClassName : undefined]
        .filter(Boolean)
        .join(" ")
      return (
        <a
          href={to}
          className={classes || undefined}
          style={style}
          onClick={(e) => {
            e.preventDefault()
            onClick?.(e)
            push(to)
          }}
        >
          {children}
        </a>
      )
    }

    return {
      Link,
      useNavigate: () => push,
      usePathname: () => pathname,
      useBack: () => back,
      useInvalidate: () => () => {},
    }
  }, [pathname, push, back])

  return (
    <RouterAdapterProvider value={adapter}>{children}</RouterAdapterProvider>
  )
}

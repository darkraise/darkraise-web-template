import type { RouterLinkProps } from "./types"

// Used by the built-in error pages so they remain functional even when
// rendered outside a RouterAdapterProvider — e.g. when TanStack Router
// mounts `defaultErrorComponent` for a router-init error before the root
// route has rendered.
export function StubLink({
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

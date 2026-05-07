import * as React from "react"

export function useEvent<TArgs extends unknown[], TReturn>(
  handler: (...args: TArgs) => TReturn,
): (...args: TArgs) => TReturn {
  const ref = React.useRef(handler)
  React.useLayoutEffect(() => {
    ref.current = handler
  })
  return React.useCallback((...args: TArgs) => ref.current(...args), [])
}

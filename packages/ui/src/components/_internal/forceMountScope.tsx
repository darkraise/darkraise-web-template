import * as React from "react"

export interface ForceMountProviderProps {
  forceMount?: boolean
  children?: React.ReactNode
}

export interface ForceMountScope {
  /**
   * Makes `forceMount` the default for the content below it. A component's
   * root provides `undefined`, so a nested instance of the same component
   * never inherits an outer portal's value.
   */
  ForceMountProvider: (props: ForceMountProviderProps) => React.ReactElement
  /** The content's own `forceMount`, or the nearest provider's when unset. */
  useResolvedForceMount: (own?: boolean) => boolean | undefined
}

/**
 * Call once per component, at module level. Each call has its own context,
 * so one component's portal never sets another component's default.
 */
export function createForceMountScope(): ForceMountScope {
  const ForceMountContext = React.createContext<boolean | undefined>(undefined)

  function ForceMountProvider({
    forceMount,
    children,
  }: ForceMountProviderProps) {
    return (
      <ForceMountContext.Provider value={forceMount}>
        {children}
      </ForceMountContext.Provider>
    )
  }

  function useResolvedForceMount(own?: boolean): boolean | undefined {
    const inherited = React.useContext(ForceMountContext)
    return own ?? inherited
  }

  return { ForceMountProvider, useResolvedForceMount }
}

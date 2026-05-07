import * as React from "react"

export function useId(override?: string): string {
  const generated = React.useId()
  return override ?? generated
}

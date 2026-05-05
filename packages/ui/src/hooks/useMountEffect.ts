import { useEffect } from "react"

export function useMountEffect(effect: CallableFunction): void {
  useEffect(() => {
    effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

import { useEffect, useState } from "react"

export type PermissionState =
  | "granted"
  | "denied"
  | "prompt"
  | "unsupported"
  | "querying"

export function usePermission(
  descriptor: PermissionDescriptor,
): PermissionState {
  const [state, setState] = useState<PermissionState>("querying")
  useEffect(
    () => {
      if (typeof navigator === "undefined" || !navigator.permissions?.query) {
        setState("unsupported")
        return
      }
      let status: globalThis.PermissionStatus | null = null
      let cancelled = false
      const handler = (): void => {
        if (status) setState(status.state as PermissionState)
      }
      navigator.permissions
        .query(descriptor)
        .then((s) => {
          if (cancelled) return
          status = s
          setState(s.state as PermissionState)
          s.addEventListener("change", handler)
        })
        .catch(() => setState("unsupported"))
      return () => {
        cancelled = true
        status?.removeEventListener("change", handler)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(descriptor)],
  )
  return state
}

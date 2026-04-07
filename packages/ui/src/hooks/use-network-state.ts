import { useEffect, useState } from "react"
import { isBrowser, off, on } from "./util"
import type { InitialState } from "./util"

export type NetworkInformation = {
  readonly downlink: number
  readonly downlinkMax: number
  readonly effectiveType: "slow-2g" | "2g" | "3g" | "4g"
  readonly rtt: number
  readonly saveData: boolean
  readonly type:
    | "bluetooth"
    | "cellular"
    | "ethernet"
    | "none"
    | "wifi"
    | "wimax"
    | "other"
    | "unknown"
} & EventTarget

export type UseNetworkState = {
  online: boolean | undefined
  previous: boolean | undefined
  since: Date | undefined
  downlink: NetworkInformation["downlink"] | undefined
  downlinkMax: NetworkInformation["downlinkMax"] | undefined
  effectiveType: NetworkInformation["effectiveType"] | undefined
  rtt: NetworkInformation["rtt"] | undefined
  saveData: NetworkInformation["saveData"] | undefined
  type: NetworkInformation["type"] | undefined
}

type NavigatorWithConnection = Navigator &
  Partial<
    Record<
      "connection" | "mozConnection" | "webkitConnection",
      NetworkInformation
    >
  >
const navigator = isBrowser
  ? (globalThis.navigator as NavigatorWithConnection)
  : undefined

const conn: NetworkInformation | undefined =
  navigator &&
  (navigator.connection ??
    navigator.mozConnection ??
    navigator.webkitConnection)

function getConnectionState(previousState?: UseNetworkState): UseNetworkState {
  const online = navigator?.onLine
  const previousOnline = previousState?.online

  return {
    online,
    previous: previousOnline,
    since: online === previousOnline ? previousState?.since : new Date(),
    downlink: conn?.downlink,
    downlinkMax: conn?.downlinkMax,
    effectiveType: conn?.effectiveType,
    rtt: conn?.rtt,
    saveData: conn?.saveData,
    type: conn?.type,
  }
}

export function useNetworkState(
  initialState?: InitialState<UseNetworkState>,
): UseNetworkState {
  const [state, setState] = useState(initialState ?? getConnectionState)

  useEffect(() => {
    const handleStateChange = () => {
      setState(getConnectionState)
    }

    on(globalThis, "online", handleStateChange, { passive: true })
    on(globalThis, "offline", handleStateChange, { passive: true })

    if (conn) {
      on(conn, "change", handleStateChange, { passive: true })
    }

    return () => {
      off(globalThis, "online", handleStateChange)
      off(globalThis, "offline", handleStateChange)

      if (conn) {
        off(conn, "change", handleStateChange)
      }
    }
  }, [])

  return state
}

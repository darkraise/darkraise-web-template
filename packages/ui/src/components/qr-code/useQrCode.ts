import * as React from "react"

import { encodeQr, type QrCodeMatrix } from "./qrEncoder"
import type { QrCodeLevel } from "./QrCode"

export interface UseQrCodeOptions {
  value: string
  level?: QrCodeLevel
}

export interface UseQrCodeReturn {
  matrix: QrCodeMatrix | null
  error: Error | null
}

export function useQrCode(options: UseQrCodeOptions): UseQrCodeReturn {
  const { value, level = "M" } = options

  return React.useMemo(() => {
    try {
      return { matrix: encodeQr(value, level), error: null }
    } catch (err) {
      return { matrix: null, error: err as Error }
    }
  }, [value, level])
}

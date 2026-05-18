import { useCallback, useEffect, useRef, useState } from "react"

export type UseClipboardReturn = {
  copy: (text: string) => Promise<boolean>
  copied: boolean
  error: Error | null
}

export function useClipboard(resetMs = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current)
        resetTimerRef.current = null
      }
    }
  }, [])

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setError(null)
        if (resetTimerRef.current !== null) {
          clearTimeout(resetTimerRef.current)
        }
        resetTimerRef.current = setTimeout(() => {
          setCopied(false)
          resetTimerRef.current = null
        }, resetMs)
        return true
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)))
        setCopied(false)
        return false
      }
    },
    [resetMs],
  )
  return { copy, copied, error }
}

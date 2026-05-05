import { useCallback, useState } from "react"

export type UseClipboardReturn = {
  copy: (text: string) => Promise<boolean>
  copied: boolean
  error: Error | null
}

export function useClipboard(resetMs = 2000): UseClipboardReturn {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setError(null)
        setTimeout(() => setCopied(false), resetMs)
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

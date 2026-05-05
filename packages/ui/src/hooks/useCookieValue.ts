import { useCallback, useEffect, useState } from "react"

export interface CookieOptions {
  path?: string
  domain?: string
  maxAge?: number
  expires?: Date
  secure?: boolean
  sameSite?: "strict" | "lax" | "none"
}

export interface CookieReturn {
  value: string | undefined
  set: (value: string, options?: CookieOptions) => void
  remove: (options?: CookieOptions) => void
  refresh: () => void
}

export function useCookieValue(name: string): CookieReturn {
  const [value, setValue] = useState<string | undefined>(() => readCookie(name))

  const set = useCallback(
    (next: string, options?: CookieOptions): void => {
      document.cookie = serializeCookie(name, next, options)
      setValue(next)
    },
    [name],
  )

  const remove = useCallback(
    (options?: CookieOptions): void => {
      document.cookie = serializeCookie(name, "", {
        ...options,
        expires: new Date(0),
      })
      setValue(undefined)
    },
    [name],
  )

  const refresh = useCallback((): void => setValue(readCookie(name)), [name])

  useEffect(refresh, [refresh])

  return { value, set, remove, refresh }
}

function readCookie(name: string): string | undefined {
  const target = `${encodeURIComponent(name)}=`
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim()
    if (trimmed.startsWith(target))
      return decodeURIComponent(trimmed.slice(target.length))
  }
  return undefined
}

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  let out = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
  out += `;path=${options.path ?? "/"}`
  if (options.domain) out += `;domain=${options.domain}`
  if (options.maxAge !== undefined) out += `;max-age=${options.maxAge}`
  if (options.expires) out += `;expires=${options.expires.toUTCString()}`
  if (options.secure) out += `;secure`
  if (options.sameSite) out += `;samesite=${options.sameSite}`
  return out
}

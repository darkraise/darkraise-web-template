import type { ResolvedMode } from "@theme/types"
import { AXES, AXIS_KEYS } from "./registry"
import { KIT_VERSION } from "./version"

export const TOKEN_CACHE_STORAGE_KEY = "theme-token-cache"

/**
 * Part of every cache id. Raise it when the set of tokens a paint writes
 * changes shape, so a set cached by an older kit build never matches.
 */
export const TOKEN_CACHE_SCHEMA = 2

export interface TokenCache {
  id: string
  tokens: Record<string, string>
}

/** Every stored key whose value changes the solved tokens. */
export function cacheInputKeys(): string[] {
  return AXIS_KEYS.map((key) => AXES[key].storageKey)
}

/**
 * The pre-render script builds the same string from the migrated values, so
 * the two must stay byte-identical: raw values, "" for absent, joined with "|".
 */
export function tokenCacheId(
  read: (key: string) => string | null,
  resolved: ResolvedMode,
): string {
  return [
    KIT_VERSION,
    String(TOKEN_CACHE_SCHEMA),
    resolved,
    ...cacheInputKeys().map((k) => read(k) ?? ""),
  ].join("|")
}

export function writeTokenCache(
  storage: Pick<Storage, "setItem">,
  id: string,
  tokens: Record<string, string>,
): void {
  try {
    const cache: TokenCache = { id, tokens }
    storage.setItem(TOKEN_CACHE_STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // Storage full or blocked: the next load paints the fallback block instead.
  }
}

export function readTokenCache(
  storage: Pick<Storage, "getItem">,
): TokenCache | null {
  try {
    const raw = storage.getItem(TOKEN_CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TokenCache>
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.tokens !== "object" ||
      parsed.tokens === null
    ) {
      return null
    }
    return { id: parsed.id, tokens: parsed.tokens }
  } catch {
    return null
  }
}

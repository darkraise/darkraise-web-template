import type { ResolvedMode } from "@theme/types"
import { fnv1a36 } from "../config/hash"
import { AXES, AXIS_KEYS, type AxisValues } from "./registry"
import { KIT_VERSION } from "./version"

export const TOKEN_CACHE_STORAGE_KEY = "theme-token-cache"

/**
 * Part of every cache id. Raise it when the set of tokens a paint writes
 * changes shape, so a set cached by an older kit build never matches.
 */
export const TOKEN_CACHE_SCHEMA = 4

export interface TokenCache {
  id: string
  tokens: Record<string, string>
}

/** Every stored key whose value changes the solved tokens. */
export function cacheInputKeys(): string[] {
  return AXIS_KEYS.map((key) => AXES[key].storageKey)
}

const REGISTRY_DEFAULTS = Object.fromEntries(
  AXIS_KEYS.map((key) => [key, AXES[key].default]),
) as AxisValues

/**
 * A short hash of the resolved config defaults. An axis the user never set
 * paints from these, so a redeploy that changes one must not match a token
 * set cached under the old ones. The pre-render script calls this same
 * function while it is built and embeds the result, so the two cannot drift.
 */
export function defaultsHash(defaults: Readonly<AxisValues>): string {
  return fnv1a36(AXIS_KEYS.map((key) => defaults[key]).join("|"))
}

/**
 * The pre-render script builds the same string from the migrated values, so
 * the two must stay byte-identical: raw values, "" for absent, then the
 * defaults hash, then `definitions` (the theme registry's hash, "" when the
 * config defines no styles or presets), joined with "|".
 */
export function tokenCacheId(
  read: (key: string) => string | null,
  resolved: ResolvedMode,
  defaults: Readonly<AxisValues> = REGISTRY_DEFAULTS,
  definitions = "",
): string {
  return [
    KIT_VERSION,
    String(TOKEN_CACHE_SCHEMA),
    resolved,
    ...cacheInputKeys().map((k) => read(k) ?? ""),
    defaultsHash(defaults),
    definitions,
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

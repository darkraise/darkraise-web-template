import { describe, expect, it } from "vitest"
import {
  TOKEN_CACHE_SCHEMA,
  TOKEN_CACHE_STORAGE_KEY,
  cacheInputKeys,
  readTokenCache,
  tokenCacheId,
  writeTokenCache,
} from "./tokenCache"
import { AXES, AXIS_KEYS } from "./registry"
import { KIT_VERSION } from "./version"

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  }
}

describe("token cache", () => {
  it("keys on exactly the registry's storage keys, glass axes included", () => {
    const keys = cacheInputKeys()
    expect(keys).toEqual(AXIS_KEYS.map((k) => AXES[k].storageKey))
    expect(keys).toContain("theme-glass-opacity")
    expect(keys).toContain("theme-glass-blur")
  })

  it("builds the id from the kit version, the schema, the resolved mode and the stored values", () => {
    expect(TOKEN_CACHE_SCHEMA).toBe(2)
    const id = tokenCacheId(
      (k) => (k === "theme-density" ? "spacious" : null),
      "dark",
    )
    expect(id.startsWith(`${KIT_VERSION}|2|dark|`)).toBe(true)
    expect(id.split("|")).toHaveLength(3 + cacheInputKeys().length)
    expect(id).toContain("spacious")
    expect(tokenCacheId(() => null, "light")).not.toBe(
      tokenCacheId(() => null, "dark"),
    )
  })

  it("round-trips through storage", () => {
    const storage = memoryStorage()
    writeTokenCache(storage, "abc", { "--primary": "217 91% 60%" })
    expect(storage.getItem(TOKEN_CACHE_STORAGE_KEY)).not.toBeNull()
    expect(readTokenCache(storage)).toEqual({
      id: "abc",
      tokens: { "--primary": "217 91% 60%" },
    })
  })

  it("reads a corrupt cache as empty", () => {
    const storage = memoryStorage()
    storage.setItem(TOKEN_CACHE_STORAGE_KEY, "{not json")
    expect(readTokenCache(storage)).toBeNull()
  })

  it("ignores a storage that throws", () => {
    const throwing = {
      setItem: () => {
        throw new Error("quota")
      },
      getItem: () => {
        throw new Error("denied")
      },
    }
    expect(() => writeTokenCache(throwing, "a", {})).not.toThrow()
    expect(readTokenCache(throwing)).toBeNull()
  })
})

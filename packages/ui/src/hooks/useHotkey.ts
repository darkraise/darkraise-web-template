import { useEffect } from "react"
import type { HotkeyEntry } from "./hotkeyRegistry"
import { registerHotkey, unregisterHotkey } from "./hotkeyRegistry"
import { useSyncedRef } from "./useSyncedRef"

const MOD_KEY: "meta" | "control" =
  typeof navigator !== "undefined" &&
  navigator.platform.toLowerCase().includes("mac")
    ? "meta"
    : "control"

export type UseHotkeyOptions = {
  description: string
  group?: string
  target?: EventTarget | null
  preventDefault?: boolean
}

export function useHotkey(
  keys: string,
  handler: (e: KeyboardEvent) => void,
  options: UseHotkeyOptions,
): void {
  const handlerRef = useSyncedRef(handler)
  const optionsRef = useSyncedRef(options)

  useEffect(() => {
    if (!keys) return
    const target = optionsRef.current.target ?? window
    const listener = (e: Event): void => {
      const ke = e as KeyboardEvent
      if (matches(ke, keys)) {
        if (optionsRef.current.preventDefault !== false) ke.preventDefault()
        handlerRef.current(ke)
      }
    }
    target.addEventListener("keydown", listener)

    const entry: HotkeyEntry = {
      keys,
      description: optionsRef.current.description,
      ...(optionsRef.current.group !== undefined
        ? { group: optionsRef.current.group }
        : {}),
    }
    const id = registerHotkey(entry)

    return () => {
      target.removeEventListener("keydown", listener)
      unregisterHotkey(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys])
}

function matches(e: KeyboardEvent, combo: string): boolean {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((p) => p.trim())
  const expectedKey = parts[parts.length - 1]
  const expectedMods = new Set(parts.slice(0, -1))
  const actualKey = e.key.toLowerCase()
  const matchesKey =
    expectedKey === actualKey ||
    (expectedKey === "space" && actualKey === " ") ||
    (expectedKey === "esc" && actualKey === "escape")
  if (!matchesKey) return false
  const expectMod = expectedMods.has("mod")
  const expectCtrl =
    expectedMods.has("ctrl") || (expectMod && MOD_KEY === "control")
  const expectMeta =
    expectedMods.has("meta") ||
    expectedMods.has("cmd") ||
    (expectMod && MOD_KEY === "meta")
  const expectShift = expectedMods.has("shift")
  const expectAlt = expectedMods.has("alt") || expectedMods.has("option")
  return (
    e.ctrlKey === expectCtrl &&
    e.metaKey === expectMeta &&
    e.shiftKey === expectShift &&
    e.altKey === expectAlt
  )
}

export interface PersistedPanelState {
  position: { x: number; y: number }
  size: { width: number; height: number }
  minimized: boolean
  maximized: boolean
  pinned: boolean
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v)

const isPoint = (v: unknown): v is { x: number; y: number } =>
  typeof v === "object" &&
  v !== null &&
  isFiniteNumber((v as { x: unknown }).x) &&
  isFiniteNumber((v as { y: unknown }).y)

const isSize = (v: unknown): v is { width: number; height: number } =>
  typeof v === "object" &&
  v !== null &&
  isFiniteNumber((v as { width: unknown }).width) &&
  isFiniteNumber((v as { height: unknown }).height)

export function parsePersistedState(
  input: unknown,
): PersistedPanelState | null {
  if (typeof input !== "object" || input === null) return null
  const v = input as Record<string, unknown>
  if (!isPoint(v.position)) return null
  if (!isSize(v.size)) return null
  if (typeof v.minimized !== "boolean") return null
  if (typeof v.maximized !== "boolean") return null
  if (typeof v.pinned !== "boolean") return null
  return {
    position: v.position,
    size: v.size,
    minimized: v.minimized,
    maximized: v.maximized,
    pinned: v.pinned,
  }
}

function getDefaultStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null
  } catch {
    return null
  }
}

export function loadPersistedState(
  key: string,
  storage: Storage | null = getDefaultStorage(),
): PersistedPanelState | null {
  if (!storage) return null
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return null
  }
  if (raw === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    try {
      storage.removeItem(key)
    } catch {
      // ignore
    }
    return null
  }
  const validated = parsePersistedState(parsed)
  if (!validated) {
    try {
      storage.removeItem(key)
    } catch {
      // ignore
    }
    return null
  }
  return validated
}

export function savePersistedState(
  key: string,
  state: PersistedPanelState,
  storage: Storage | null = getDefaultStorage(),
): void {
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(state))
  } catch {
    // quota exceeded, disabled storage — swallow.
  }
}

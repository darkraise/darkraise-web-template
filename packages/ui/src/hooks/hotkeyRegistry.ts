export interface HotkeyEntry {
  keys: string
  description: string
  group?: string
}

const entries = new Map<symbol, HotkeyEntry>()
const subscribers = new Set<() => void>()

const notify = (): void => {
  for (const fn of subscribers) fn()
}

export function registerHotkey(entry: HotkeyEntry): symbol {
  const id = Symbol(entry.keys)
  entries.set(id, entry)
  notify()
  return id
}

export function unregisterHotkey(id: symbol): void {
  if (entries.delete(id)) notify()
}

export function getHotkeyEntries(): HotkeyEntry[] {
  return Array.from(entries.values())
}

export function subscribeHotkeys(fn: () => void): () => void {
  subscribers.add(fn)
  return () => {
    subscribers.delete(fn)
  }
}

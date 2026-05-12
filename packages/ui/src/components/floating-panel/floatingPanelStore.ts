import type * as React from "react"

export interface AppPanelEntry {
  id: string
  /** Null when hydrated from storage but no route has declared a matching id. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any> | null
  componentProps: Record<string, unknown>
  open: boolean
  position: { x: number; y: number }
  size: { width: number; height: number }
  minimized: boolean
  maximized: boolean
  pinned: boolean
  persistKey: string | null
}

export interface RegisterInput {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
  componentProps: Record<string, unknown>
  defaultOpen?: boolean
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  defaultMinimized?: boolean
  defaultMaximized?: boolean
  defaultPinned?: boolean
  persistKey?: string | null
}

export interface FloatingPanelStore {
  getEntries(): Record<string, AppPanelEntry>
  getEntry(id: string): AppPanelEntry | undefined
  getIdsSnapshot(): readonly string[]
  list(): AppPanelEntry[]
  subscribe(listener: () => void): () => void
  register(id: string, input: RegisterInput): void
  update(id: string, patch: Partial<AppPanelEntry>): void
  open(id: string, componentProps?: Record<string, unknown>): void
  close(id: string): void
  toggle(id: string): void
}

const DEFAULT_POSITION = { x: 0, y: 0 } as const
const DEFAULT_SIZE = { width: 320, height: 240 } as const

export function createFloatingPanelStore(): FloatingPanelStore {
  let entries: Record<string, AppPanelEntry> = {}
  let idsSnapshot: readonly string[] = []
  const listeners = new Set<() => void>()

  const notify = () => {
    for (const fn of listeners) fn()
  }

  const recomputeIdsSnapshot = () => {
    const next = Object.keys(entries)
    if (
      next.length === idsSnapshot.length &&
      next.every((id, i) => idsSnapshot[i] === id)
    ) {
      return
    }
    idsSnapshot = next
  }

  return {
    getEntries: () => entries,
    getEntry: (id) => entries[id],
    getIdsSnapshot: () => idsSnapshot,
    list: () => Object.values(entries),
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    register(id, input) {
      const existing = entries[id]
      if (existing) {
        if (existing.component && existing.component !== input.component) {
          console.warn(
            `[FloatingPanel] scope="app" id="${id}" was re-registered with a different component reference. Keeping the new one (last-write-wins). Make sure two routes aren't declaring the same id with different components.`,
          )
        }
        entries = {
          ...entries,
          [id]: {
            ...existing,
            component: input.component,
            componentProps: input.componentProps,
            persistKey: input.persistKey ?? existing.persistKey,
          },
        }
        notify()
        return
      }
      const next: AppPanelEntry = {
        id,
        component: input.component,
        componentProps: input.componentProps,
        open: input.defaultOpen ?? true,
        position: input.defaultPosition ?? { ...DEFAULT_POSITION },
        size: input.defaultSize ?? { ...DEFAULT_SIZE },
        minimized: input.defaultMinimized ?? false,
        maximized: input.defaultMaximized ?? false,
        pinned: input.defaultPinned ?? false,
        persistKey: input.persistKey ?? null,
      }
      entries = { ...entries, [id]: next }
      recomputeIdsSnapshot()
      notify()
    },
    update(id, patch) {
      const existing = entries[id]
      if (!existing) return
      entries = { ...entries, [id]: { ...existing, ...patch } }
      notify()
    },
    open(id, componentProps) {
      const existing = entries[id]
      if (!existing) {
        if (process.env.NODE_ENV !== "production") {
          throw new Error(
            `[FloatingPanel] scope="app" id="${id}" was never registered. Render <FloatingPanel scope="app" id="${id}" component={...}/> somewhere first.`,
          )
        }
        return
      }
      entries = {
        ...entries,
        [id]: {
          ...existing,
          open: true,
          componentProps: componentProps ?? existing.componentProps,
        },
      }
      notify()
    },
    close(id) {
      const existing = entries[id]
      if (!existing) {
        if (process.env.NODE_ENV !== "production") {
          throw new Error(
            `[FloatingPanel] scope="app" id="${id}" was never registered.`,
          )
        }
        return
      }
      entries = { ...entries, [id]: { ...existing, open: false } }
      notify()
    },
    toggle(id) {
      const existing = entries[id]
      if (!existing) {
        if (process.env.NODE_ENV !== "production") {
          throw new Error(
            `[FloatingPanel] scope="app" id="${id}" was never registered.`,
          )
        }
        return
      }
      entries = { ...entries, [id]: { ...existing, open: !existing.open } }
      notify()
    },
  }
}

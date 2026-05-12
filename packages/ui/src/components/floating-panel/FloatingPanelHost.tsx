"use client"

import * as React from "react"
import { FloatingPanel } from "./FloatingPanel"
import { useFloatingPanelStore } from "./FloatingPanelProvider"
import type { AppPanelEntry, FloatingPanelStore } from "./floatingPanelStore"

function useEntry(
  store: FloatingPanelStore,
  id: string,
): AppPanelEntry | undefined {
  return React.useSyncExternalStore(
    store.subscribe,
    () => store.getEntry(id),
    () => store.getEntry(id),
  )
}

function useIds(store: FloatingPanelStore): readonly string[] {
  return React.useSyncExternalStore(
    store.subscribe,
    () => store.getIdsSnapshot(),
    () => store.getIdsSnapshot(),
  )
}

function AppPanelInstance({ id }: { id: string }) {
  const store = useFloatingPanelStore()
  const entry = useEntry(store, id)
  if (!entry || !entry.open || !entry.component) return null
  const Component = entry.component
  return (
    <FloatingPanel
      scope="global"
      position={entry.position}
      onPositionChange={(position) => store.update(id, { position })}
      size={entry.size}
      onSizeChange={(size) => store.update(id, { size })}
      minimized={entry.minimized}
      onMinimizedChange={(minimized) => store.update(id, { minimized })}
      maximized={entry.maximized}
      onMaximizedChange={(maximized) => store.update(id, { maximized })}
      pinned={entry.pinned}
      onPinnedChange={(pinned) => store.update(id, { pinned })}
      open={entry.open}
      onOpenChange={(open) => store.update(id, { open })}
    >
      <Component {...entry.componentProps} />
    </FloatingPanel>
  )
}

export function FloatingPanelHost() {
  const store = useFloatingPanelStore()
  const ids = useIds(store)
  return (
    <>
      {ids.map((id) => (
        <AppPanelInstance key={id} id={id} />
      ))}
    </>
  )
}

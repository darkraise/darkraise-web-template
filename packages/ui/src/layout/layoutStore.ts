import { create } from "zustand"

export type LayoutVariant = "sidebar" | "top-nav" | "stacked" | "split-panel"

export const LAYOUT_VARIANTS: readonly LayoutVariant[] = [
  "sidebar",
  "top-nav",
  "stacked",
  "split-panel",
]

interface LayoutState {
  layout: LayoutVariant
  setLayout: (layout: LayoutVariant) => void
}

const getStoredLayout = (): LayoutVariant => {
  // SSR-safe: `localStorage` is undefined on the server. Returning the
  // static default here keeps the server's first render in sync with the
  // client's hydration render. After hydration, consumer code can call
  // `useLayoutStore.setState({ layout: ... })` from an effect to switch.
  if (typeof window === "undefined") return "sidebar"
  try {
    const stored = localStorage.getItem("layout-variant")
    if (LAYOUT_VARIANTS.includes(stored as LayoutVariant)) {
      return stored as LayoutVariant
    }
  } catch {
    // localStorage unavailable (private browsing, sandboxed iframe).
  }
  return "sidebar"
}

export const useLayoutStore = create<LayoutState>((set) => ({
  layout: getStoredLayout(),
  setLayout: (layout) => {
    try {
      localStorage.setItem("layout-variant", layout)
    } catch {
      // localStorage unavailable (SSR or private browsing); state still
      // updates in memory for the current session.
    }
    set({ layout })
  },
}))

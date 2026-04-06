import { create } from "zustand"

export type LayoutVariant = "sidebar" | "top-nav" | "stacked"

interface LayoutState {
  layout: LayoutVariant
  setLayout: (layout: LayoutVariant) => void
}

const getStoredLayout = (): LayoutVariant => {
  try {
    const stored = localStorage.getItem("layout-variant")
    if (stored === "sidebar" || stored === "top-nav" || stored === "stacked") {
      return stored
    }
  } catch {
    // localStorage unavailable (SSR or private browsing)
  }
  return "sidebar"
}

export const useLayoutStore = create<LayoutState>((set) => ({
  layout: getStoredLayout(),
  setLayout: (layout) => {
    localStorage.setItem("layout-variant", layout)
    set({ layout })
  },
}))

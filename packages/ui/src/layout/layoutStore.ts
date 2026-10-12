import { create } from "zustand"
import { SHELL_STYLES, type ShellStyle } from "@theme/types"

export type LayoutVariant = "sidebar" | "top-nav" | "stacked" | "split-panel"

export const LAYOUT_VARIANTS: readonly LayoutVariant[] = [
  "sidebar",
  "top-nav",
  "stacked",
  "split-panel",
]

/** Kept from 6.x, when the theme owned shell style, so stored picks survive. */
export const SHELL_STYLE_STORAGE_KEY = "theme-shell-style"

interface LayoutState {
  layout: LayoutVariant
  setLayout: (layout: LayoutVariant) => void
  /** The user's pick; `null` when nothing is stored or the stored value is unknown. */
  shellStyle: ShellStyle | null
  setShellStyle: (style: ShellStyle) => void
  /** Forgets the user's pick, so the preset's or the layout's default applies. */
  clearShellStyle: () => void
}

const getStoredLayout = (): LayoutVariant => {
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

const getStoredShellStyle = (): ShellStyle | null => {
  try {
    const stored = localStorage.getItem(SHELL_STYLE_STORAGE_KEY)
    if (SHELL_STYLES.includes(stored as ShellStyle)) {
      return stored as ShellStyle
    }
  } catch {
    // localStorage unavailable (private browsing, sandboxed iframe).
  }
  return null
}

export const useLayoutStore = create<LayoutState>((set) => ({
  layout: "sidebar",
  setLayout: (layout) => {
    try {
      localStorage.setItem("layout-variant", layout)
    } catch {
      // localStorage unavailable (SSR or private browsing); state still
      // updates in memory for the current session.
    }
    set({ layout })
  },
  shellStyle: null,
  setShellStyle: (shellStyle) => {
    try {
      localStorage.setItem(SHELL_STYLE_STORAGE_KEY, shellStyle)
    } catch {
      // localStorage unavailable (SSR or private browsing); state still
      // updates in memory for the current session.
    }
    set({ shellStyle })
  },
  clearShellStyle: () => {
    try {
      localStorage.removeItem(SHELL_STYLE_STORAGE_KEY)
    } catch {
      // localStorage unavailable (SSR or private browsing); state still
      // updates in memory for the current session.
    }
    set({ shellStyle: null })
  },
}))

// zustand serves getInitialState() as the server snapshot, so hydration
// renders these defaults as the server did and then the stored values;
// a client-only app reads getState() and shows the stored values at once.
if (typeof window !== "undefined") {
  useLayoutStore.setState({
    layout: getStoredLayout(),
    shellStyle: getStoredShellStyle(),
  })
}

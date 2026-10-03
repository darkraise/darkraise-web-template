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

const getStoredShellStyle = (): ShellStyle | null => {
  // Same SSR rule as getStoredLayout: the server renders the unset state.
  if (typeof window === "undefined") return null
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
  shellStyle: getStoredShellStyle(),
  setShellStyle: (shellStyle) => {
    try {
      localStorage.setItem(SHELL_STYLE_STORAGE_KEY, shellStyle)
    } catch {
      // localStorage unavailable (SSR or private browsing); state still
      // updates in memory for the current session.
    }
    set({ shellStyle })
  },
}))

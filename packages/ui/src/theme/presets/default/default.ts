import type { ThemePreset } from "../types"

const WHITE = "0 0% 100%"

export const defaultPreset: ThemePreset<Record<string, never>> = {
  name: "default",
  label: "Default",
  description:
    "Subtle elevation through background-color shifts. No backdrop effects.",
  axes: {},
  surfaceRecipe: {
    surfaceRaised: (s, m) => (m === "light" ? WHITE : s[900]),
    surfaceOverlay: (s, m) => (m === "light" ? WHITE : s[800]),
    surfaceSunken: (s, m) => (m === "light" ? s[100] : s[950]),
    surfaceSidebar: (s, m) => (m === "light" ? s[50] : s[950]),
    surfaceHeader: (s, m) => (m === "light" ? WHITE : s[900]),
    borderSubtle: (s, m) => (m === "light" ? s[100] : s[800]),
    borderDefault: (s, m) => (m === "light" ? s[200] : s[700]),
    overrides: {
      shadowCard: "none",
      shadowDropdown:
        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    },
  },
}

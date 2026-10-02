import type { ThemePreset } from "../types"

export const defaultPreset: ThemePreset<Record<string, never>> = {
  name: "default",
  label: "Default",
  description:
    "Subtle elevation through background-color shifts. No backdrop effects.",
  axes: {},
  shadowDropdown:
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
}

export type SeparatorOrientation = "horizontal" | "vertical"

export interface UseSeparatorOptions {
  orientation?: SeparatorOrientation
  decorative?: boolean
}

export interface UseSeparatorReturn {
  role: "separator" | "none"
  "aria-orientation"?: "vertical"
  "data-orientation": SeparatorOrientation
}

export function useSeparator(
  options: UseSeparatorOptions = {},
): UseSeparatorReturn {
  const { orientation = "horizontal", decorative = true } = options
  if (decorative) {
    return {
      role: "none",
      "data-orientation": orientation,
    }
  }
  return {
    role: "separator",
    "aria-orientation": orientation === "vertical" ? "vertical" : undefined,
    "data-orientation": orientation,
  }
}

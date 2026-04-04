import type {
  SurfaceStyle,
  SurfaceStyleRecipe,
  ColorScale,
  ResolvedMode,
} from "../types"

const WHITE = "0 0% 100%"

function lightDark(
  scale: ColorScale,
  mode: ResolvedMode,
  lightStep: keyof ColorScale,
  darkStep: keyof ColorScale,
): string {
  return mode === "light" ? scale[lightStep] : scale[darkStep]
}

const defaultStyle: SurfaceStyleRecipe = {
  name: "default",
  label: "Default",
  description:
    "Subtle elevation through background color shifts. No shadows. Clean and neutral.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
  },
}

const flat: SurfaceStyleRecipe = {
  name: "flat",
  label: "Flat",
  description:
    "No visual distinction between surface levels. Borders do all separation work.",
  tokens: {
    surfaceRaised: (scale, mode) => lightDark(scale, mode, 50, 950),
    surfaceOverlay: (scale, mode) => lightDark(scale, mode, 50, 900),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 50, 950),
    surfaceHeader: (scale, mode) => lightDark(scale, mode, 50, 950),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
  },
}

const bordered: SurfaceStyleRecipe = {
  name: "bordered",
  label: "Bordered",
  description: "Flat surfaces with prominent borders. Strong grid/panel feel.",
  tokens: {
    surfaceRaised: (scale, mode) => lightDark(scale, mode, 50, 950),
    surfaceOverlay: (scale, mode) => lightDark(scale, mode, 50, 900),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 50, 950),
    surfaceHeader: (scale, mode) => lightDark(scale, mode, 50, 950),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 200, 700),
    borderDefault: (scale, mode) => lightDark(scale, mode, 300, 600),
  },
  overrides: {
    radius: "0.375rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    borderWidth: "2px",
  },
}

const elevated: SurfaceStyleRecipe = {
  name: "elevated",
  label: "Elevated",
  description: "Soft shadows for layering. Cards float above the background.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    shadowDropdown:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
  },
}

const layered: SurfaceStyleRecipe = {
  name: "layered",
  label: "Layered",
  description:
    "More aggressive depth with stacked shadow layers. Clear visual hierarchy.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 100, 800),
  },
  overrides: {
    radius: "0.75rem",
    shadowCard:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    shadowDropdown:
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    borderWidth: "0",
  },
}

const glassmorphism: SurfaceStyleRecipe = {
  name: "glassmorphism",
  label: "Glassmorphism",
  description:
    "Frosted glass effect with backdrop-blur, semi-transparent surfaces.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 200, 700),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.75rem",
    shadowCard: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
    shadowDropdown:
      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    backdropBlur: "12px",
    surfaceOpacity: "0.8",
  },
}

const highContrast: SurfaceStyleRecipe = {
  name: "high-contrast",
  label: "High Contrast",
  description:
    "Maximum separation between surface levels. Sharp borders, bold differences.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[950]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 950, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[950]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 200, 700),
    borderDefault: (scale, mode) => lightDark(scale, mode, 300, 600),
  },
  overrides: {
    radius: "0.375rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    borderWidth: "2px",
    foreground: (scale, mode) => (mode === "light" ? scale[950] : scale[50]),
    border: (scale, mode) => lightDark(scale, mode, 300, 600),
    input: (scale, mode) => lightDark(scale, mode, 300, 600),
  },
}

const muted: SurfaceStyleRecipe = {
  name: "muted",
  label: "Muted",
  description: "Very low contrast between surfaces. Soft, calm feel.",
  tokens: {
    surfaceRaised: (scale, mode) => lightDark(scale, mode, 50, 900),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 100, 900),
    surfaceHeader: (scale, mode) => lightDark(scale, mode, 50, 900),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 100, 800),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    border: (scale, mode) => lightDark(scale, mode, 100, 800),
    input: (scale, mode) => lightDark(scale, mode, 100, 800),
  },
}

const compact: SurfaceStyleRecipe = {
  name: "compact",
  label: "Compact",
  description: "Tighter radius, dense information display.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.25rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
  },
}

const translucent: SurfaceStyleRecipe = {
  name: "translucent",
  label: "Translucent",
  description: "Semi-transparent surfaces without blur. Light, airy feel.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode) => (mode === "light" ? WHITE : _scale[900]),
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "none",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "0.85",
  },
}

const tinted: SurfaceStyleRecipe = {
  name: "tinted",
  label: "Tinted",
  description: "Surfaces lightly tinted with the accent color. Brand-forward.",
  tokens: {
    surfaceRaised: (_scale, mode, accentScale) =>
      accentScale
        ? mode === "light"
          ? accentScale[50]
          : accentScale[950]
        : mode === "light"
          ? WHITE
          : _scale[900],
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale, mode) => lightDark(scale, mode, 900, 950),
    surfaceHeader: (_scale, mode, accentScale) =>
      accentScale
        ? mode === "light"
          ? accentScale[50]
          : accentScale[950]
        : mode === "light"
          ? WHITE
          : _scale[900],
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 800),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 700),
  },
  overrides: {
    radius: "0.5rem",
    shadowCard: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    accent: (_scale, mode, accentScale) =>
      accentScale
        ? mode === "light"
          ? accentScale[100]
          : accentScale[900]
        : mode === "light"
          ? _scale[100]
          : _scale[800],
    accentForeground: (_scale, mode, accentScale) =>
      accentScale
        ? mode === "light"
          ? accentScale[900]
          : accentScale[100]
        : mode === "light"
          ? _scale[900]
          : _scale[50],
  },
}

const bold: SurfaceStyleRecipe = {
  name: "bold",
  label: "Bold",
  description:
    "Dark sidebar and header regardless of mode. Vibrant accent usage.",
  tokens: {
    surfaceRaised: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceOverlay: (_scale, mode) => (mode === "light" ? WHITE : _scale[800]),
    surfaceSunken: (scale, mode) => lightDark(scale, mode, 100, 950),
    surfaceSidebar: (scale) => scale[900],
    surfaceHeader: (scale) => scale[950],
    borderSubtle: (scale, mode) => lightDark(scale, mode, 100, 700),
    borderDefault: (scale, mode) => lightDark(scale, mode, 200, 600),
  },
  overrides: {
    radius: "0.75rem",
    shadowCard: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    shadowDropdown:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    backdropBlur: "none",
    surfaceOpacity: "1",
    borderWidth: "0",
  },
}

export const surfaceStyles: Record<SurfaceStyle, SurfaceStyleRecipe> = {
  default: defaultStyle,
  flat,
  bordered,
  elevated,
  layered,
  glassmorphism,
  "high-contrast": highContrast,
  muted,
  compact,
  translucent,
  tinted,
  bold,
}

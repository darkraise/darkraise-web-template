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

export const surfaceStyles: Record<SurfaceStyle, SurfaceStyleRecipe> = {
  default: defaultStyle,
  flat,
  glassmorphism,
  tinted,
}

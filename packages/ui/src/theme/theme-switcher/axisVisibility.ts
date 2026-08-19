import type { ThemeConfig } from "@theme/themeConfig"
import type { BackgroundStyle } from "@theme/types"

/**
 * Everything an axis needs to decide whether its control is shown.
 *
 * Four independent kinds of rule govern visibility, and before this table they
 * were interleaved with JSX in `useThemeSettingsSections` — a config flag per
 * axis, `modeLocked` from the preset's `supportedModes`, membership of the
 * preset's `hiddenCommonAxes`, and one-off dependencies on another axis's
 * value. Each was correct, but the set could only be understood by reading the
 * whole hook, which is why auditing it was hard enough to become its own task.
 */
export interface AxisVisibilityInput {
  axes: ThemeConfig["switcher"]["axes"]
  backgroundStyle: BackgroundStyle
  /** True when the active preset supports exactly one mode. */
  modeLocked: boolean
  /** True when the active preset lists this axis in `hiddenCommonAxes`. */
  isHiddenByPreset: (axisName: string) => boolean
  /** How many preset-specific axes the active preset declares. */
  presetAxisCount: number
}

export type AxisName = keyof ThemeConfig["switcher"]["axes"]

/**
 * One predicate per axis. Every key in `themeConfig.switcher.axes` must appear
 * here — a test asserts it, so a newly added axis cannot ship without stating
 * when it is visible.
 */
export const AXIS_VISIBILITY: Record<
  AxisName,
  (input: AxisVisibilityInput) => boolean
> = {
  // Hidden outright when the preset supports a single mode: the provider has
  // already switched to it, so the control offers no real choice.
  mode: (s) => s.axes.mode && !s.modeLocked,
  preset: (s) => s.axes.preset,
  // The group renders nothing when the active preset declares no axes of its
  // own, rather than an empty container.
  presetAxes: (s) => s.axes.presetAxes && s.presetAxisCount > 0,

  backgroundStyle: (s) => s.axes.backgroundStyle,
  // No gradient gate: this axis absorbed canvasTint, so under `solid` it still
  // drives the canvas saturation cap. Only its blob-scale half is
  // gradient-specific, and that half goes inert rather than hiding the control.
  backgroundIntensity: (s) => s.axes.backgroundIntensity,
  // Genuinely gradient-only — there is no pattern to choose under `solid`.
  gradientPattern: (s) =>
    s.axes.gradientPattern && s.backgroundStyle === "gradient",

  accentColor: (s) => s.axes.accentColor,
  surfaceColor: (s) => s.axes.surfaceColor,

  density: (s) => s.axes.density && !s.isHiddenByPreset("density"),
  fontSize: (s) => s.axes.fontSize && !s.isHiddenByPreset("fontSize"),
  radius: (s) => s.axes.radius && !s.isHiddenByPreset("radius"),

  // Default-preset controls: Glass and Sci-fi reinterpret the same surfaces
  // through their own recipes and hide these, which also neutralises them.
  accentIntensity: (s) =>
    s.axes.accentIntensity && !s.isHiddenByPreset("accentIntensity"),
  surfaceIntensity: (s) =>
    s.axes.surfaceIntensity && !s.isHiddenByPreset("surfaceIntensity"),

  elevation: (s) => s.axes.elevation && !s.isHiddenByPreset("elevation"),
  buttonElevation: (s) =>
    s.axes.buttonElevation && !s.isHiddenByPreset("buttonElevation"),

  // Global: every preset either consumes the composed tokens or drives its own
  // recipe from the same step, so no preset hides these by default.
  outerGlow: (s) => s.axes.outerGlow && !s.isHiddenByPreset("outerGlow"),
  innerGlow: (s) => s.axes.innerGlow && !s.isHiddenByPreset("innerGlow"),
}

export function isAxisVisible(
  axis: AxisName,
  input: AxisVisibilityInput,
): boolean {
  return AXIS_VISIBILITY[axis](input)
}

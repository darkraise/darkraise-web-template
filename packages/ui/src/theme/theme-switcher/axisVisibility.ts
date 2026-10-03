import type { ThemeConfig } from "@theme/themeConfig"
import type { AxisKey } from "@theme/axes/registry"
import type { AccentColor, BackgroundStyle } from "@theme/types"

/**
 * Everything an axis needs to decide whether its control is shown.
 *
 * Three independent kinds of rule govern visibility, and before this table they
 * were interleaved with JSX in `useThemeSettingsSections` — a config flag per
 * axis, membership of the preset's `hiddenCommonAxes`, and one-off
 * dependencies on another axis's value. Each was correct, but the set could
 * only be understood by reading the whole hook, which is why auditing it was
 * hard enough to become its own task.
 */
export interface AxisVisibilityInput {
  axes: ThemeConfig["switcher"]["axes"]
  backgroundStyle: BackgroundStyle
  accentColor: AccentColor
  /** True when the active preset lists this axis in `hiddenCommonAxes`. */
  isHiddenByPreset: (axisName: string) => boolean
  /** How many preset-specific axes the active preset declares. */
  presetAxisCount: number
}

/** Every registry axis, plus the active preset's own axes as one group. */
export type AxisName = AxisKey | "presetAxes"

// An axis missing from `switcher.axes` is shown.
const enabled = (s: AxisVisibilityInput, axis: AxisKey): boolean =>
  s.axes?.[axis] !== false

/**
 * One predicate per axis. Every registry axis must appear here — a test
 * asserts it, so a newly added axis cannot ship without stating when it is
 * visible.
 */
export const AXIS_VISIBILITY: Record<
  AxisName,
  (input: AxisVisibilityInput) => boolean
> = {
  mode: (s) => enabled(s, "mode"),
  preset: (s) => enabled(s, "preset"),
  sidebarActiveBar: (s) => enabled(s, "sidebarActiveBar"),
  // The preset's own axes follow the preset control, and the group renders
  // nothing when the active preset declares no axes of its own.
  presetAxes: (s) => enabled(s, "preset") && s.presetAxisCount > 0,

  backgroundStyle: (s) => enabled(s, "backgroundStyle"),
  // No gradient gate: this axis absorbed canvasTint, so under `solid` it still
  // drives the canvas saturation cap. Only its blob-scale half is
  // gradient-specific, and that half goes inert rather than hiding the control.
  backgroundIntensity: (s) => enabled(s, "backgroundIntensity"),
  // Genuinely gradient-only — there is no pattern to choose under `solid`.
  gradientPattern: (s) =>
    enabled(s, "gradientPattern") && s.backgroundStyle === "gradient",

  accentColor: (s) => enabled(s, "accentColor"),
  surfaceColor: (s) => enabled(s, "surfaceColor"),
  font: (s) => enabled(s, "font"),

  density: (s) => enabled(s, "density") && !s.isHiddenByPreset("density"),
  fontSize: (s) => enabled(s, "fontSize") && !s.isHiddenByPreset("fontSize"),
  radius: (s) => enabled(s, "radius") && !s.isHiddenByPreset("radius"),

  elevation: (s) =>
    enabled(s, "elevation") && !s.isHiddenByPreset("elevation"),

  // Global: every preset either consumes the composed tokens or drives its own
  // recipe from the same step, so no preset hides these by default.
  outerGlow: (s) =>
    enabled(s, "outerGlow") && !s.isHiddenByPreset("outerGlow"),
  innerGlow: (s) =>
    enabled(s, "innerGlow") && !s.isHiddenByPreset("innerGlow"),

  contrast: (s) => enabled(s, "contrast") && !s.isHiddenByPreset("contrast"),
  darkAccentChroma: (s) =>
    enabled(s, "darkAccentChroma") && !s.isHiddenByPreset("darkAccentChroma"),
  // Under the neutral accent there is no hue to mix in.
  tintWithAccent: (s) =>
    enabled(s, "tintWithAccent") && s.accentColor !== "neutral",
}

export function isAxisVisible(
  axis: AxisName,
  input: AxisVisibilityInput,
): boolean {
  return AXIS_VISIBILITY[axis](input)
}

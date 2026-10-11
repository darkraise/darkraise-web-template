import { useUiLabels } from "@labels"
import { AXES, type AxisKey, type AxisValue } from "@theme/axes/registry"
import { resolveAccentScale } from "@theme/engine/generateTokens"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { AccentColor, SurfaceColor } from "@theme/types"
import { useTheme } from "@theme/useTheme"
import type { UiMessages } from "../../../i18n/types"

interface SwatchSpec {
  /** HSL triplet painted on the swatch. */
  color: (value: string, surface: SurfaceColor, dark: boolean) => string
  title: (value: string, labels: UiMessages, dark: boolean) => string
}

const themeOption = (value: string, labels: UiMessages): string =>
  labels.themeOptions[value as keyof UiMessages["themeOptions"]] ?? value

const SWATCHES: Partial<Record<AxisKey, SwatchSpec>> = {
  accentColor: {
    // The neutral accent renders near-black in light and near-white in
    // dark; the swatch shows the one the current mode will paint.
    color: (value, surface, dark) =>
      resolveAccentScale(value as AccentColor, surface)[
        value === "neutral" ? (dark ? 50 : 900) : 500
      ],
    // The neutral accent shares its value with the neutral surface, whose
    // label would read as a grey rather than near-black or near-white.
    title: (value, labels, dark) =>
      value === "neutral"
        ? dark
          ? labels.themeOptions.neutralAccentDark
          : labels.themeOptions.neutralAccent
        : themeOption(value, labels),
  },
  surfaceColor: {
    color: (value) => surfaceColors[value as SurfaceColor][500],
    title: themeOption,
  },
  signalColor: {
    // `none` repeats the accent, so its swatch is the quiet neutral.
    color: (value, surface, dark) =>
      value === "none"
        ? surfaceColors[surface][200]
        : resolveAccentScale(value as AccentColor, surface)[
            value === "neutral" ? (dark ? 50 : 900) : 500
          ],
    title: (value, labels, dark) =>
      value === "neutral"
        ? dark
          ? labels.themeOptions.neutralAccentDark
          : labels.themeOptions.neutralAccent
        : themeOption(value, labels),
  },
}

export function SwatchControl({ axis }: { axis: AxisKey }) {
  const labels = useUiLabels()
  const theme = useTheme()
  const spec = SWATCHES[axis]
  if (!spec) return null
  const current: string = theme[axis]
  const dark = theme.resolvedMode === "dark"

  return (
    <div className="dr-theme-switcher-swatch-grid">
      {(AXES[axis].values as readonly string[]).map((value) => (
        <button
          key={value}
          type="button"
          title={spec.title(value, labels, dark)}
          className="dr-theme-switcher-swatch"
          data-active={current === value ? "true" : undefined}
          aria-pressed={current === value}
          style={{
            backgroundColor: `hsl(${spec.color(value, theme.surfaceColor, dark)})`,
          }}
          onClick={() => theme.setAxis(axis, value as AxisValue<AxisKey>)}
        />
      ))}
    </div>
  )
}

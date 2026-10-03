import { useUiLabels } from "@labels"
import { AXES, type AxisKey, type AxisValue } from "@theme/axes/registry"
import { resolveAccentScale } from "@theme/engine/generateTokens"
import { surfaceColors } from "@theme/palettes/surfaceColors"
import type { AccentColor, SurfaceColor } from "@theme/types"
import { useTheme } from "@theme/useTheme"
import type { UiMessages } from "../../../i18n/types"

interface SwatchSpec {
  /** HSL triplet painted on the swatch. */
  color: (value: string, surface: SurfaceColor) => string
  title: (value: string, labels: UiMessages) => string
  /** Stamps `data-value`, which dark mode reads to outline the near-black neutral accent. */
  tagValue: boolean
}

const themeOption = (value: string, labels: UiMessages): string =>
  labels.themeOptions[value as keyof UiMessages["themeOptions"]] ?? value

const SWATCHES: Partial<Record<AxisKey, SwatchSpec>> = {
  accentColor: {
    color: (value, surface) =>
      resolveAccentScale(value as AccentColor, surface)[
        value === "neutral" ? 900 : 500
      ],
    // The neutral accent shares its value with the neutral surface, whose
    // label would read as a grey rather than near-black.
    title: (value, labels) =>
      value === "neutral"
        ? labels.themeOptions.neutralAccent
        : themeOption(value, labels),
    tagValue: true,
  },
  surfaceColor: {
    color: (value) => surfaceColors[value as SurfaceColor][500],
    title: themeOption,
    tagValue: false,
  },
}

export function SwatchControl({ axis }: { axis: AxisKey }) {
  const labels = useUiLabels()
  const theme = useTheme()
  const spec = SWATCHES[axis]
  if (!spec) return null
  const current: string = theme[axis]

  return (
    <div className="dr-theme-switcher-swatch-grid">
      {(AXES[axis].values as readonly string[]).map((value) => (
        <button
          key={value}
          type="button"
          title={spec.title(value, labels)}
          className="dr-theme-switcher-swatch"
          data-value={spec.tagValue ? value : undefined}
          data-active={current === value ? "true" : undefined}
          style={{
            backgroundColor: `hsl(${spec.color(value, theme.surfaceColor)})`,
          }}
          onClick={() => theme.setAxis(axis, value as AxisValue<AxisKey>)}
        />
      ))}
    </div>
  )
}

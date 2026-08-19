import { Slider } from "@components/slider"
import { ToggleGroup, ToggleGroupItem } from "@components/toggle-group"

/** Render an ordinal 4-value axis as a stepped slider (cleaner than a
 *  4-cell toggle group at the popover's compact width). Lower-arity or
 *  categorical axes fall back to the original toggle group. The current
 *  value name is shown to the right of the slider thumb so the discrete
 *  position has a readable label. */
export function AxisControl<V extends string>({
  values,
  value,
  onChange,
  label,
}: {
  values: readonly V[]
  value: V
  onChange: (v: V) => void
  label: string
}) {
  // 4 and 5 render as a stepped slider; anything else is a ToggleGroup. Scoped
  // to these two rather than `>= 4` so a future six-value axis does not
  // silently become a slider too fine to aim at.
  if (values.length === 4 || values.length === 5) {
    const index = Math.max(0, values.indexOf(value))
    return (
      <div className="dr-theme-switcher-slider-control">
        <Slider
          value={[index]}
          min={0}
          max={values.length - 1}
          step={1}
          showSteps
          aria-label={label}
          onValueChange={([i]) => {
            if (typeof i === "number" && values[i]) onChange(values[i])
          }}
        />
        <span className="dr-theme-switcher-slider-value">{value}</span>
      </div>
    )
  }
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v as V)
      }}
      variant="outline"
      size="sm"
      aria-label={label}
      className="dr-theme-switcher-toggle-group"
      data-cols={values.length}
    >
      {values.map((v) => (
        <ToggleGroupItem key={v} value={v} className="capitalize">
          {v}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

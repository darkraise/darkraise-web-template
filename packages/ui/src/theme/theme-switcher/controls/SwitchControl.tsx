import { Switch } from "@components/switch"
import { useUiLabels } from "@labels"
import type { AxisKey, AxisValue } from "@theme/axes/registry"
import { useTheme } from "@theme/useTheme"

export function SwitchControl({ axis }: { axis: AxisKey }) {
  const labels = useUiLabels()
  const theme = useTheme()

  return (
    <Switch
      checked={theme[axis] === "on"}
      onCheckedChange={(checked) =>
        theme.setAxis(axis, (checked ? "on" : "off") as AxisValue<AxisKey>)
      }
      aria-label={labels.theme.axisLabels[axis]}
    />
  )
}

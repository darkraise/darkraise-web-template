import { useUiLabels } from "@labels"
import { AXES, type AxisKey, type AxisValue } from "@theme/axes/registry"
import { useTheme } from "@theme/useTheme"
import { AxisControl } from "../AxisControl"

export function OrdinalControl({ axis }: { axis: AxisKey }) {
  const labels = useUiLabels()
  const theme = useTheme()

  return (
    <AxisControl
      values={AXES[axis].values as readonly string[]}
      value={theme[axis]}
      onChange={(value) => theme.setAxis(axis, value as AxisValue<AxisKey>)}
      label={labels.theme.axisLabels[axis]}
    />
  )
}

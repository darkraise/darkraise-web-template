import { defaultLabels } from "../../labels/defaults"
import { AXES, AXIS_KEYS, type AxisLayer } from "./registry"

export interface ScaffoldAxis {
  values: readonly string[]
  default: string
  storageKey: string
  attribute: string | null
  layer: AxisLayer
  /** English switcher label; the scaffold's prompt message. */
  label: string
  /** Heading the scaffold's axis picker files the axis under. */
  groupLabel: string
}

const { axisLabels, groupLabels } = defaultLabels.theme

// The switcher shows the style layer's axes under the Style control, so the
// picker uses that control's label as the group heading.
const GROUP_LABELS: Record<AxisLayer, string> = {
  brand: groupLabels.brand,
  style: axisLabels.style,
  advanced: groupLabels.advanced,
}

/** What create-darkraise-ui needs from the registry; it has no kit dependency. */
export function scaffoldAxes(): Record<string, ScaffoldAxis> {
  return Object.fromEntries(
    AXIS_KEYS.map((key) => [
      key,
      {
        values: AXES[key].values,
        default: AXES[key].default,
        storageKey: AXES[key].storageKey,
        attribute: AXES[key].attribute ?? null,
        layer: AXES[key].layer,
        label: axisLabels[key],
        groupLabel: GROUP_LABELS[AXES[key].layer],
      },
    ]),
  )
}

import { AXES, AXIS_KEYS, type AxisLayer } from "./registry"

export interface ScaffoldAxis {
  values: readonly string[]
  default: string
  storageKey: string
  attribute: string | null
  layer: AxisLayer
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
      },
    ]),
  )
}

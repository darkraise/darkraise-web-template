import type { SurfaceIntensity } from "@theme/types"

/**
 * The four axis steps plus `none`, which is prop-only - the theme axis never
 * offers it. Passed straight through to `data-surface-intensity`; every value
 * including `balanced` has a CSS rule, so the prop is an absolute override
 * rather than a nudge.
 */
export type SurfaceIntensityProp = SurfaceIntensity | "none"

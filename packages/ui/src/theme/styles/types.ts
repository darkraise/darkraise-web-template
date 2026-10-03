import type { AxisValues } from "@theme/axes/registry"

export interface StyleRecord {
  /**
   * Values for axes the user never set; they beat the app's config defaults.
   * Never `mode` or `style`: the pre-render script resolves those first.
   */
  defaults: Partial<Omit<AxisValues, "mode" | "style">>
  /** Frosted chrome over the canvas: no content strip, chrome painted on the page ground. */
  frosted: boolean
}

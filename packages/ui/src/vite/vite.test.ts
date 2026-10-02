import { describe, expect, it } from "vitest"
import { darkraisePrerender } from "./index"
import { buildPrerenderScript } from "@theme/axes/prerender"

describe("darkraisePrerender", () => {
  it("adds the pre-render script to the document head", () => {
    const plugin = darkraisePrerender()
    expect(plugin.name).toBe("darkraise-prerender")
    const hook = plugin.transformIndexHtml as unknown as {
      order: string
      handler: () => { tag: string; children: string; injectTo: string }[]
    }
    expect(hook.order).toBe("pre")
    expect(hook.handler()).toEqual([
      { tag: "script", children: buildPrerenderScript(), injectTo: "head" },
    ])
  })
})

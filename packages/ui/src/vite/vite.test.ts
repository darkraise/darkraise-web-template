import { afterEach, describe, expect, it, vi } from "vitest"
import type { Plugin } from "vite"
import { buildPrerenderScript } from "@theme/axes/prerender"
import type { ThemeConfig } from "@theme/themeConfig"
import { darkraisePrerender } from "./index"

interface IndexHtmlHook {
  order: string
  handler: () => { tag: string; children: string; injectTo: string }[]
}

const hookOf = (plugin: Plugin) =>
  plugin.transformIndexHtml as unknown as IndexHtmlHook

afterEach(() => {
  vi.restoreAllMocks()
})

describe("darkraisePrerender", () => {
  it("adds the pre-render script to the document head", () => {
    const plugin = darkraisePrerender()
    expect(plugin.name).toBe("darkraise-prerender")
    const hook = hookOf(plugin)
    expect(hook.order).toBe("pre")
    expect(hook.handler()).toEqual([
      { tag: "script", children: buildPrerenderScript(), injectTo: "head" },
    ])
  })

  it("builds the script from the config defaults it is given", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const defaults: ThemeConfig["defaults"] = { mode: "dark", style: "glass" }
    const script = hookOf(darkraisePrerender({ defaults })).handler()[0]
      ?.children
    expect(script).toBe(buildPrerenderScript({ defaults }))
    expect(script).not.toBe(buildPrerenderScript())
    expect(warn).not.toHaveBeenCalled()
  })

  it("drops invalid defaults with one warning when it is created", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const defaults = {
      accentColor: "rose",
      radius: "huge",
      preset: "glass",
    } as unknown as ThemeConfig["defaults"]
    const plugin = darkraisePrerender({ defaults })
    expect(warn).toHaveBeenCalledOnce()
    const message = String(warn.mock.calls[0]?.[0])
    expect(message).toContain('radius "huge"')
    expect(message).toContain('preset "glass"')
    expect(message).not.toContain("accentColor")
    expect(hookOf(plugin).handler()[0]?.children).toBe(
      buildPrerenderScript({ defaults: { accentColor: "rose" } }),
    )
  })
})

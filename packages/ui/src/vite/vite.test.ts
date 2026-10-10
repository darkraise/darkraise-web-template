import { afterEach, describe, expect, it, vi } from "vitest"
import type { Plugin } from "vite"
import { buildPrerenderScript } from "@theme/axes/prerender"
import { compileThemeCss } from "@theme/config/compile"
import { resolveRegistry } from "@theme/config/registry"
import { themeConfig, type ThemeConfig } from "@theme/themeConfig"
import { darkraisePrerender } from "./index"

interface IndexHtmlHook {
  order: string
  handler: () => {
    tag: string
    attrs?: Record<string, string>
    children: string
    injectTo: string
  }[]
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

describe("darkraisePrerender with a theme config", () => {
  const config: ThemeConfig = {
    ...themeConfig,
    defaults: { style: "ink", preset: "night" },
    styles: {
      ink: {
        label: "Ink",
        extends: "glass",
        tokens: { shared: { cardEdge: "hsl(var(--primary-8))" } },
      },
    },
    presets: {
      night: { label: "Night", style: "ink", axes: { accentColor: "violet" } },
    },
  }

  it("injects the consumer stylesheet, then the script built from the config", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const registry = resolveRegistry(config)
    expect(hookOf(darkraisePrerender({ config })).handler()).toEqual([
      {
        tag: "style",
        attrs: { "data-darkraise-theme": registry.hash },
        children: compileThemeCss(registry, { include: "consumer" }),
        injectTo: "head",
      },
      {
        tag: "script",
        children: buildPrerenderScript(config),
        injectTo: "head",
      },
    ])
    expect(registry.hash).not.toBe("")
    expect(warn).not.toHaveBeenCalled()
  })

  it("injects only the script for a config without definitions", () => {
    const plain: ThemeConfig = { ...themeConfig, defaults: { style: "glass" } }
    expect(hookOf(darkraisePrerender({ config: plain })).handler()).toEqual([
      {
        tag: "script",
        children: buildPrerenderScript(plain),
        injectTo: "head",
      },
    ])
  })

  it("ignores defaults when a config is given", () => {
    const [, script] = hookOf(
      darkraisePrerender({ config, defaults: { style: "tactile" } }),
    ).handler()
    expect(script?.children).toBe(buildPrerenderScript(config))
  })

  it("puts the nonce on the stylesheet and the script", () => {
    expect(
      hookOf(darkraisePrerender({ config, nonce: "r4nd" }))
        .handler()
        .map((tag) => tag.attrs),
    ).toEqual([
      { "data-darkraise-theme": resolveRegistry(config).hash, nonce: "r4nd" },
      { nonce: "r4nd" },
    ])
    expect(
      hookOf(darkraisePrerender({ nonce: "r4nd" }))
        .handler()
        .map((tag) => tag.attrs),
    ).toEqual([{ nonce: "r4nd" }])
  })

  it("throws with one line per definition error", () => {
    const broken = {
      ...themeConfig,
      styles: {
        ink: { label: "Ink", tokens: { shared: { cardGlow: "red" } } },
        Bad: { label: "Bad" },
      },
      presets: { dusk: { label: "Dusk", style: "nowhere" } },
    } as unknown as ThemeConfig
    expect(() => darkraisePrerender({ config: broken })).toThrow(
      new Error(
        [
          "[darkraisePrerender] Invalid theme definitions:",
          '- styles.Bad: "Bad" is not a kebab-case name',
          '- styles.ink.tokens.shared.cardGlow: "cardGlow" is not a paint token',
          '- presets.dusk.style: "nowhere" is not a style',
        ].join("\n"),
      ),
    )
  })

  it("throws when the default preset belongs to another style", () => {
    expect(() =>
      darkraisePrerender({
        config: { ...config, defaults: { style: "glass", preset: "night" } },
      }),
    ).toThrow(
      new Error(
        [
          "[darkraisePrerender] Invalid theme definitions:",
          '- defaults.preset: "night" belongs to style "ink", not "glass"',
        ].join("\n"),
      ),
    )
    expect(() =>
      darkraisePrerender({
        config: { ...config, defaults: { preset: "night" } },
      }),
    ).toThrow('- defaults.preset: "night" belongs to style "ink", not "quiet"')
  })

  it("still injects a definition that has only warnings", () => {
    const warned: ThemeConfig = {
      ...themeConfig,
      styles: {
        ink: {
          label: "Ink",
          tokens: { shared: { cardEdge: "var(--primary-8)" } },
        },
      },
    }
    expect(resolveRegistry(warned).issues).toHaveLength(1)
    const [style] = hookOf(darkraisePrerender({ config: warned })).handler()
    expect(style?.children).toContain('[data-style="ink"]')
  })
})

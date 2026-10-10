import { describe, expect, it } from "vitest"
import { compileThemeCss, LAYER_STATEMENT } from "./compile"
import { buildRegistry } from "./registry"
import type { StyleDefinition, ThemeDefinitions } from "./schema"

const BUILTINS: Record<string, StyleDefinition> = {
  plain: { label: "Plain" },
  frost: {
    label: "Frost",
    vars: {
      shared: { "--frost-fog": "white" },
      dark: { "--frost-fog": "black" },
    },
    tokens: {
      shared: { cardEdge: "var(--frost-fog)", overlayFillLayers: "" },
      light: { chromeEdge: "silver" },
      dark: { chromeEdge: "gray" },
    },
    when: [
      { axes: { glassOpacity: "subtle" }, tokens: { overlayFillBase: "a" } },
      {
        axes: { glassOpacity: "subtle", glassBlur: "high" },
        mode: "dark",
        tokens: { chromeBackdrop: "blur(9px)" },
        vars: { "--frost-fog": "navy" },
      },
      {
        axes: { backgroundStyle: "gradient" },
        mode: "light",
        tokens: { chromeCanvas: "var(--canvas-ink)" },
      },
    ],
    forcedFallback: {
      tokens: { chromeBackdrop: "none", overlayFillLayers: "" },
    },
  },
}

const CONSUMER: ThemeDefinitions = {
  styles: {
    "frost-ink": {
      label: "Ink",
      extends: "frost",
      tokens: { dark: { cardSheen: "none" } },
      when: [{ axes: { contrast: "high" }, tokens: { cardEdge: "black" } }],
    },
  },
  presets: {
    night: {
      label: "Night",
      style: "frost-ink",
      tokens: {
        shared: { buttonEdge: "1px" },
        light: { buttonSheen: "white" },
        dark: { buttonShadow: "none" },
      },
    },
  },
}

const FROST_CSS = `@layer style.base {
  [data-style="frost"] {
    --frost-fog: white;
    --card-edge: var(--frost-fog);
    --surface-overlay-layers: ;
  }
  [data-style="frost"]:not([data-mode="dark"]) {
    --chrome-edge: silver;
  }
}

@layer style.mode {
  [data-mode="dark"][data-style="frost"] {
    --frost-fog: black;
    --chrome-edge: gray;
  }
}

@layer style.when {
  [data-style="frost"][data-glass-opacity="subtle"] {
    --surface-overlay-base: a;
  }
  [data-mode="dark"][data-style="frost"][data-glass-opacity="subtle"][data-glass-blur="high"] {
    --frost-fog: navy;
    --chrome-backdrop: blur(9px);
  }
  [data-style="frost"]:not([data-mode="dark"])[data-background-style="gradient"] {
    --chrome-canvas: var(--canvas-ink);
  }
}

@layer style.fallback {
  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
    [data-style="frost"] {
      --chrome-backdrop: none;
      --surface-overlay-layers: ;
    }
  }
}`

describe("LAYER_STATEMENT", () => {
  it("orders the style layers between base and components", () => {
    expect(LAYER_STATEMENT).toBe(
      "@layer properties, theme, base, style.base, style.mode, style.when, style.preset, style.fallback, components, utilities, overrides;",
    )
  })
})

describe("compileThemeCss", () => {
  it("emits each mode key, when entry and fallback of a built-in in its layer", () => {
    expect(
      compileThemeCss(buildRegistry(BUILTINS), { include: "builtin" }),
    ).toBe(`${LAYER_STATEMENT}\n\n${FROST_CSS}\n`)
  })

  it("re-emits an inherited style under its own selector, then its presets", () => {
    expect(
      compileThemeCss(buildRegistry(BUILTINS, CONSUMER), {
        include: "consumer",
      }),
    ).toBe(`${LAYER_STATEMENT}

@layer style.base {
  [data-style="frost-ink"] {
    --frost-fog: white;
    --card-edge: var(--frost-fog);
    --surface-overlay-layers: ;
  }
  [data-style="frost-ink"]:not([data-mode="dark"]) {
    --chrome-edge: silver;
  }
}

@layer style.mode {
  [data-mode="dark"][data-style="frost-ink"] {
    --frost-fog: black;
    --chrome-edge: gray;
    --card-sheen: none;
  }
}

@layer style.when {
  [data-style="frost-ink"][data-glass-opacity="subtle"] {
    --surface-overlay-base: a;
  }
  [data-mode="dark"][data-style="frost-ink"][data-glass-opacity="subtle"][data-glass-blur="high"] {
    --frost-fog: navy;
    --chrome-backdrop: blur(9px);
  }
  [data-style="frost-ink"]:not([data-mode="dark"])[data-background-style="gradient"] {
    --chrome-canvas: var(--canvas-ink);
  }
  [data-style="frost-ink"][data-contrast="high"] {
    --card-edge: black;
  }
}

@layer style.fallback {
  @media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
    [data-style="frost-ink"] {
      --chrome-backdrop: none;
      --surface-overlay-layers: ;
    }
  }
}

@layer style.preset {
  [data-preset="night"] {
    --btn-edge: 1px;
  }
  [data-preset="night"]:not([data-mode="dark"]) {
    --btn-sheen: white;
  }
  [data-mode="dark"][data-preset="night"] {
    --btn-shadow: none;
  }
}
`)
  })

  it("leaves consumer definitions out of the built-in sheet", () => {
    expect(
      compileThemeCss(buildRegistry(BUILTINS, CONSUMER), {
        include: "builtin",
      }),
    ).toBe(compileThemeCss(buildRegistry(BUILTINS), { include: "builtin" }))
  })

  it("prints only the layer statement when nothing is included", () => {
    expect(
      compileThemeCss(buildRegistry(BUILTINS), { include: "consumer" }),
    ).toBe(`${LAYER_STATEMENT}\n`)
    expect(
      compileThemeCss(buildRegistry({ plain: { label: "Plain" } }), {
        include: "builtin",
      }),
    ).toBe(`${LAYER_STATEMENT}\n`)
  })

  it("omits empty rules and empty layers", () => {
    const registry = buildRegistry(
      {},
      {
        styles: {
          bare: { label: "Bare", tokens: { light: { cardEdge: "none" } } },
          lone: {
            label: "Lone",
            when: [{ axes: { radius: "pill" }, tokens: { cardSheen: "none" } }],
          },
        },
        presets: { calm: { label: "Calm", style: "bare" } },
      },
    )
    expect(compileThemeCss(registry, { include: "consumer" }))
      .toBe(`${LAYER_STATEMENT}

@layer style.base {
  [data-style="bare"]:not([data-mode="dark"]) {
    --card-edge: none;
  }
}

@layer style.when {
  [data-style="lone"][data-radius="pill"] {
    --card-sheen: none;
  }
}
`)
  })

  it("selects a when entry with no axes and no mode by the style alone", () => {
    const registry = buildRegistry(
      {},
      {
        styles: {
          lone: {
            label: "Lone",
            when: [
              { axes: {}, mode: "light", tokens: { cardSheen: "a" } },
              { axes: {}, tokens: { cardSheen: "b" } },
            ],
          },
        },
      },
    )
    expect(compileThemeCss(registry, { include: "consumer" }))
      .toBe(`${LAYER_STATEMENT}

@layer style.when {
  [data-style="lone"]:not([data-mode="dark"]) {
    --card-sheen: a;
  }
  [data-style="lone"] {
    --card-sheen: b;
  }
}
`)
  })

  it("prints equal output for equal input", () => {
    const first = compileThemeCss(buildRegistry(BUILTINS, CONSUMER), {
      include: "consumer",
    })
    const second = compileThemeCss(
      buildRegistry(structuredClone(BUILTINS), structuredClone(CONSUMER)),
      { include: "consumer" },
    )
    expect(second).toBe(first)
  })
})

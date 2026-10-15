# Custom styles and presets

This guide shows how to define your own styles, presets and fonts for darkraise-ui, and documents the vocabulary the kit's own styles and presets are written in. It assumes an app that imports `darkraise-ui/styles.css` and mounts `ThemeProvider`. The [7.0 upgrade guide](upgrade-7.0.md) covers what changed from 6.x, and the package README covers the rest of the [theme config](../packages/ui/README.md#theme-config).

## Concepts

- An **axis** is one theme setting a user can change, such as `accentColor`, `radius` or `mode`. The user's choice is kept in browser storage. Everything a definition sets for an axis is a default that the user's own choice replaces.
- A **style** is a complete look. It sets paint tokens, signatures and defaults for some axes. The kit ships four: `flat`, `quiet`, `tactile` and `glass`. The `style` axis selects one, and `quiet` is the default.
- A **preset** is a named variant of one style. It sets axis values (usually the brand: accent, neutral, fonts), signatures, paint tokens and optionally a shell style, on top of its style. The `preset` axis selects one. Its value `base`, the default, means the style alone.
- A **font** is a name for a typeface the app loads itself. Registering it makes it a value of the `font` and `headingFont` axes.
- A **paint token** is a CSS custom property the kit's components read, such as `--card-edge`. A definition sets it by its schema name, `cardEdge`, to any CSS value of the kind the token takes.
- A **signature** is a structural choice from a fixed list that the kit implements, such as `tableHead: "ruled"`.
- **Colour** comes from the kit's colour engine, which solves every colour token from the accent, the neutral ramp, the mode and the contrast axes. A definition refers to those tokens and never sets them.

The kit's four styles and sixteen presets are written with exactly what this page describes, so anything they do, your definitions can do.

## Quick start

Put the definitions in the theme config. The helpers come from `darkraise-ui/theme-config`, an entry with no React and no Node imports, so the same file loads in `vite.config.ts`, in the app and on a server.

```ts
// src/theme.config.ts
import {
  defineFont,
  definePreset,
  defineStyle,
  defineThemeConfig,
} from "darkraise-ui/theme-config"

export const themeConfig = defineThemeConfig({
  defaults: { style: "harbor", preset: "harbor-night" },
  switcher: { enabled: true },
  fonts: {
    "instrument-sans": defineFont({
      label: "Instrument Sans",
      family:
        '"Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif',
      role: "sans",
    }),
  },
  styles: {
    harbor: defineStyle({
      label: "Harbor",
      extends: "quiet",
      signatures: { navSelection: "rule", tableHead: "ruled" },
      tokens: {
        shared: {
          cardRadius: "calc(var(--radius) * 1.5)",
          cardEdge: "0 1px 0 hsl(var(--foreground) / 0.06)",
        },
        dark: { cardEdge: "0 1px 0 rgb(0 0 0 / 0.4)" },
      },
    }),
  },
  presets: {
    "harbor-night": definePreset({
      label: "Harbor night",
      style: "harbor",
      axes: {
        accentColor: "teal",
        surfaceColor: "slate",
        font: "instrument-sans",
      },
      signatures: { cardFooter: "inset", badgeStyle: "tint" },
      shellStyle: "inset",
    }),
  },
})
```

Give the same config to the Vite plugin and to the provider.

```ts
// vite.config.ts
import react from "@vitejs/plugin-react"
import { darkraisePrerender } from "darkraise-ui/vite"
import { defineConfig } from "vite"
import { themeConfig } from "./src/theme.config"

export default defineConfig({
  plugins: [darkraisePrerender({ config: themeConfig }), react()],
})
```

```tsx
// src/app-providers.tsx
import { ThemeProvider } from "darkraise-ui/theme"
import type { ReactNode } from "react"
import { themeConfig } from "./theme.config"

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider config={themeConfig}>{children}</ThemeProvider>
}
```

The theme switcher now lists Harbor after the four built-in styles, and Harbor night in the Preset control while Harbor is the active style. The document root carries `data-style="harbor"` and `data-preset="harbor-night"`.

## The theme config

`defineThemeConfig`, `defineStyle`, `definePreset` and `defineFont` return their argument unchanged. They exist for the types: a definition is plain data, and a config written without them works the same.

A config has these keys:

- `defaults` (required, may be `{}`): the app's default for any axis, including `style` and `preset`.
- `switcher` (required): `enabled`, and optionally `axes`, `advanced` and `presets`. See [The theme switcher](#the-theme-switcher).
- `fonts`, `styles` and `presets` (optional): the definitions, each a record keyed by name.

A name becomes an attribute value on the document root, so it must be kebab-case: lower-case letters and digits in groups joined by single hyphens, starting with a letter. A name may not be `base`, `default`, `glassmorphism` or `scifi`, and may not equal the name of a built-in style, a built-in preset or, for a font, a built-in font or `body`. The built-in preset names are listed under [Built-in presets](#built-in-presets).

### The JSON form

The same config can live in a JSON file checked by the schema the package publishes as `darkraise-ui/theme.schema.json`. Editors resolve `$schema` as a file path, so point it at the file inside `node_modules`.

<!-- sample: src/theme.config.json -->

```json
{
  "$schema": "../node_modules/darkraise-ui/dist/theme.schema.json",
  "defaults": { "style": "quiet", "preset": "quiet-plum" },
  "switcher": { "enabled": true },
  "presets": {
    "quiet-plum": {
      "label": "Plum",
      "style": "quiet",
      "axes": {
        "accentColor": "purple",
        "surfaceColor": "mauve",
        "headingFont": "newsreader"
      },
      "signatures": { "navSelection": "pill", "badgeStyle": "chip" },
      "tokens": {
        "shared": { "cardRadius": "calc(var(--radius) * 1.25)" },
        "light": { "cardEdge": "0 1px 2px hsl(var(--foreground) / 0.06)" },
        "dark": { "cardEdge": "0 1px 2px rgb(0 0 0 / 0.5)" }
      }
    }
  }
}
```

TypeScript reads a JSON import with every string widened to `string`, so the import needs one cast to `ThemeConfig`. The schema, not the compiler, is then what checks the file's names and values.

```ts
// src/theme-from-json.ts
import type { ThemeConfig } from "darkraise-ui/theme-config"
import json from "./theme.config.json"

export const themeConfig = json as ThemeConfig
```

The schema checks shapes, names and values. The rules that span definitions are checked when the config is resolved: that an `extends` target exists and forms no cycle, that a preset's style exists, that a private variable carries its style's prefix, and that a preset does not set a token its style reserves (see [Defining a preset](#defining-a-preset)).

### What happens to a mistake

`resolveRegistry(config)` from `darkraise-ui/theme-config` merges the built-ins with your definitions and returns the result with an `issues` list. Each issue has a `level` (`error` or `warning`), a `path` such as `presets.harbor-night.tokens.shared.cardEdge`, and a `message`.

- A definition with an error is left out: a style, a preset or a font that fails a check does not exist for the app. A style that extends a style with errors, and a preset of one, are left out too.
- `darkraisePrerender` throws on any error, so the Vite build and the dev server fail with `[darkraisePrerender] Invalid theme definitions:` followed by one line per error.
- `ThemeProvider` prints every issue once with `console.warn` outside production builds, as `[ThemeProvider] themeConfig.<path>: <message>. The definition is ignored.` for an error. Warnings are only printed here: the Vite plugin does not report them.

The errors are: a name that breaks the rules above; an unknown token, signature, signature value, axis or axis value; an `extends` target that does not exist, has errors or closes a cycle; a preset whose style does not exist; a private variable without its style's prefix; a `when` entry that tests an axis it may not test; a preset token its style sets in a `when` entry; and a value that is not a string or could escape its rule (it contains `{`, `}` or `</style`, contains `;` outside brackets or quotes, leaves a bracket, quote or comment open, or ends with a backslash).

## Defining a style

```ts
import { defineStyle } from "darkraise-ui/theme-config"

export const panes = defineStyle({
  label: "Panes",
  frosted: true,
  hairlines: "alpha",
  defaults: {
    backgroundStyle: "gradient",
    gradientPattern: "mesh",
    backgroundIntensity: "subtle",
  },
  signatures: {
    navSelection: "frosted",
    barEdge: "none",
    fieldFill: "translucent",
    cardDivider: "hairline",
  },
  vars: {
    shared: { "--panes-edge": "inset 0 1px 0 rgb(255 255 255 / 0.6)" },
    dark: { "--panes-edge": "inset 0 1px 0 rgb(255 255 255 / 0.08)" },
  },
  tokens: {
    shared: {
      surfaceFillAlpha: "0.7",
      surfaceBackdrop: "blur(16px) saturate(140%)",
      cardEdge: "var(--panes-edge)",
      cardRadius: "calc(var(--radius) * 1.5)",
      dialogFill: "hsl(var(--popover) / 0.9)",
    },
    light: { cardBorder: "rgb(255 255 255 / 0.5)" },
    dark: { cardBorder: "rgb(255 255 255 / 0.1)", surfaceFillAlpha: "0.6" },
  },
  when: [
    {
      axes: { backgroundStyle: "solid" },
      tokens: { surfaceFillAlpha: "1", surfaceBackdrop: "none" },
    },
    {
      axes: { contrast: "high" },
      mode: "dark",
      tokens: { cardBorder: "rgb(255 255 255 / 0.2)" },
    },
  ],
  forcedFallback: { tokens: { dialogFill: "hsl(var(--popover))" } },
})
```

Every field but `label` is optional.

### `label`

The name the Style control shows, as written. It is not passed through the labels system, so translate it yourself if the app is translated.

### `extends`

The name of a built-in style or of another style in the config. The style starts from the whole parent: its `frosted` flag, `defaults`, `signatures`, `hairlines`, `vars`, `tokens`, `when` entries and `forcedFallback`. It then overrides per key: per axis in `defaults`, per signature, per variable and per token within each mode key. Its `when` entries are added after the parent's, and its `forcedFallback` tokens replace the parent's per token.

A style that extends Glass shows the Glass transparency and blur controls in the switcher and inherits the rules that answer them.

A style without `extends` starts from the kit's defaults, which is the look every component has before any style applies. That is not Quiet: Quiet is a definition of its own that sets tokens and signatures. Extend `quiet` if you want to start from it.

### `tokens` and the mode keys

`tokens` holds paint token values under three mode keys.

- `shared` applies in both modes, and also when the document has no `data-mode` attribute at all, as in a unit test.
- `light` applies whenever the mode is not dark.
- `dark` applies in dark mode only.

In dark mode a `dark` value replaces the `shared` value of the same token, and in light mode a `light` value does. So write a value once under `shared` when it suits both modes, and add a `dark` entry only for what must differ. In the example the card border is written per mode, and the card's alpha is `0.7` except in dark mode, where it is `0.6`.

When a style sets a token under `shared`, that also drops what its parent set for the token under `light` and `dark`.

Each value is a CSS string of the kind the token takes; the kinds are listed under [Paint tokens](#paint-tokens). The empty string is a valid value.

### `vars`

Private custom properties for values the style uses more than once, under the same three mode keys. Each name must start with `--<style name>-`, or with the same prefix of a style it extends, so `panes` may declare `--panes-edge` and a style extending Glass may redeclare `--glass-noise`. Tokens, and the presets of the style, read them with `var()`.

### `when`

Token and variable values that apply only while certain axes hold certain values. Each entry names one or more axes in `axes`, optionally a `mode` (`light` or `dark`), and the `tokens` and `vars` to apply. An entry may test any axis of the table under [Axes a definition can set](#axes-a-definition-can-set) except `sidebarSelection`.

A `when` value replaces the style's `shared`, `light` and `dark` values of the same token. Between two entries that both match, the one that tests more (more axes, or a mode as well) wins, and array order decides between entries that test the same amount.

Glass uses `when` for its Transparency and Blur steps and writes only variables there (`--glass-transparency-scale`, `--glass-blur`, `--glass-scrim-blur` and `--glass-backdrop-off`), so its presets may set any token. In the example, Panes turns its cards opaque when the user picks a solid canvas, and strengthens the card border in dark mode under high contrast.

### `forcedFallback`

Token values that apply when the user asks for more contrast (`prefers-contrast: more`). Reduced transparency (`prefers-reduced-transparency: reduce`) does not apply them: Windows reports it whenever its Transparency effects setting is off, so it would turn glass solid for a user who chose it; another style is the way to ask for solid surfaces. They replace everything else the style or a preset sets for those tokens.

The kit resets these tokens itself under the same two conditions, for every style and preset: `chromeBackdrop`, `chromeCanvas`, `overlayBackdrop`, `overlayFillLayers`, `overlayFillBase`, `overlayFillBlend`, `surfaceFillAlpha`, `overlayFillAlpha`, `surfaceBackdrop` and `scrimBackdrop`. Each returns to its opaque, unblurred value, so Panes needs no entry for its card alpha or backdrop.

Where your own `forcedFallback` sets one of these tokens, your value wins over the kit's reset.

Any other translucent value is yours to reset. Panes gives dialogs a 90% fill, which the kit does not know about, so its `forcedFallback` restores the opaque one.

### `defaults`

Values for axes the user has not set. They beat the app's `defaults`, so use them for what the look depends on (Panes needs a gradient canvas) and leave the rest to the app. The built-in styles set only axes of this kind (`elevation`, the canvas axes) and no accent, neutral, font, radius or density.

### `signatures` and `hairlines`

`signatures` picks structural choices; see [Signatures](#signatures).

`hairlines` is `opaque` (the default) or `alpha`. Under `alpha` the engine writes the four border colours (`--border`, `--border-subtle`, `--border-default` and `--border-strong`) as a neutral ink at an alpha solved to keep each line's contrast over the card and the page, so a line keeps its strength there and blends with whatever else lies under it. The field edge stays opaque. Only a style sets `hairlines`; a preset inherits its style's.

### `frosted`

Tells the colour engine that the style's chrome lets the canvas show through. Under a gradient canvas the engine then paints no strip of canvas behind the top of the content, and in dark mode it solves the sidebar surface on the page colour instead of the card colour. Glass sets it. It does not make anything translucent by itself: that is done with tokens.

## Defining a preset

```ts
import { definePreset } from "darkraise-ui/theme-config"

export const panesEmber = definePreset({
  label: "Ember",
  style: "panes",
  axes: {
    accentColor: "orange",
    surfaceColor: "stone",
    radius: "pill",
    backgroundIntensity: "balanced",
  },
  signatures: { menuHighlight: "tint", badgeStyle: "chip" },
  tokens: {
    shared: { cardRadius: "calc(var(--radius) * 2)" },
    light: {
      cardEdge:
        "var(--panes-edge), 0 8px 24px -12px hsl(var(--foreground) / 0.25)",
    },
    dark: {
      cardEdge: "var(--panes-edge), 0 8px 24px -12px rgb(0 0 0 / 0.6)",
    },
  },
  shellStyle: "island",
})
```

- `label` (required): the name the Preset control shows, as written.
- `style` (required): the style the preset belongs to, built-in or from the config. A preset is offered and applied only while that style is active.
- `axes`: values for axes the user has not set. They beat the style's `defaults` and the app's `defaults`. An axis the preset leaves out stays with the style, the app and the user.
- `signatures`: structural choices that replace the style's, per signature. To undo a choice of the style, set the signature to the kit default explicitly.
- `tokens`: paint token values under the same `shared`, `light` and `dark` keys as a style. They replace the style's values.
- `shellStyle`: the shell the layouts use under this preset unless the user picked one. See [Precedence](#precedence).

A preset has no `vars`, `when` or `forcedFallback` of its own. It may read its style's private variables, as `--panes-edge` above.

Two rules follow from where a preset sits in the cascade, above everything its style writes except the fallback.

**Write per mode what the style writes per mode.** A preset's `shared` value replaces its style's value in both modes, including a `dark` value of the style. If the style sets a token differently in dark mode, a preset that sets the same token under `shared` alone removes that difference. Give the preset a `dark` entry too (or `light` and `dark` entries) whenever the value contains a colour that should not be the same in both modes, such as a black or white shadow.

**A preset cannot set a token its style sets in a `when` entry.** The preset's value would replace every step of the axis the `when` entries answer, and the user's control would stop working. Such a preset is rejected with `style "panes" sets "surfaceFillAlpha" in a when entry, which a preset may not override`. Glass sets no token in a `when` entry: its steps write variables, so a preset of Glass may set any token, `overlayFillBase`, `overlayBackdrop` and `scrimBackdrop` included. A preset that wants a heavier blur sets the axis, `axes: { glassBlur: "high" }`, rather than a blur length.

## Defining a font

A font definition names a face; the app loads the files. To use Instrument Sans, install its package and import it once in the app's entry.

```tsx
// src/main.tsx
import "@fontsource-variable/instrument-sans"
import "./styles/globals.css"
```

Then register the family under the name the axes will use, as the quick start does:

```ts
import { defineFont } from "darkraise-ui/theme-config"

export const instrumentSans = defineFont({
  label: "Instrument Sans",
  family: '"Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif',
  role: "sans",
})
```

- `label`: the name the Font and Heading Font controls show.
- `family`: a CSS `font-family` list. Put the loaded family first and system fallbacks after it. The name must match the `font-family` the loaded stylesheet declares: the variable packages of Fontsource append `Variable`.
- `role`: `sans`, `serif` or `display`. The kit records it and does not act on it, so the fallbacks in `family` are what a missing face falls back to.

A registered font is a value of both font axes. `font` sets the body face, and `headingFont` sets the face of `h1` to `h3` and of the `font-heading` utility; its value `body` keeps the body face. Use the name in `defaults`, in a style's `defaults` or in a preset's `axes`.

The kit ships five faces as files of its own: `inter`, `geist`, `ibm-plex-sans`, `hanken-grotesk` (the default) and `newsreader` (a serif, upright only, with a weight axis). Monospace text is always JetBrains Mono.

### Giving a built-in preset another face

Some built-in presets were designed around a face the kit does not ship and use the nearest kit face instead: in Paper & Ink, Geist stands in for Instrument Sans. A preset's `font` beats the app's `defaults.font`, so setting the default does not change a built-in preset. Copy the preset under a name of your own instead. The registry hands out every built-in definition as data.

```ts
import {
  defineFont,
  definePreset,
  defineThemeConfig,
  resolveRegistry,
} from "darkraise-ui/theme-config"

const paperInk = resolveRegistry().presets["paper-ink"]
if (!paperInk) throw new Error("paper-ink is not a built-in preset")

export const themeConfig = defineThemeConfig({
  defaults: { style: "quiet", preset: "paper-ink-instrument" },
  switcher: { enabled: true },
  fonts: {
    "instrument-sans": defineFont({
      label: "Instrument Sans",
      family:
        '"Instrument Sans Variable", ui-sans-serif, system-ui, sans-serif',
      role: "sans",
    }),
  },
  presets: {
    "paper-ink-instrument": definePreset({
      label: "Paper & Ink (Instrument Sans)",
      style: paperInk.style,
      axes: { ...paperInk.axes, font: "instrument-sans" },
      signatures: paperInk.signatures,
      tokens: paperInk.tokens,
      ...(paperInk.shellStyle && { shellStyle: paperInk.shellStyle }),
    }),
  },
})
```

## Axes a definition can set

A style's `defaults` and a preset's `axes` take any of these. `mode`, `style` and `preset` are not in the list: no definition sets them.

| Axis                  | Values                                                                                                                                                                             | Registry default | Sets                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accentColor`         | `red`, `coral`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `neutral`         | `blue`           | Accent hue of the primary fill, marks, focus ring and links.                                                                                                   |
| `surfaceColor`        | `slate`, `gray`, `cool`, `zinc`, `neutral`, `iron`, `mauve`, `graphite`, `stone`, `sand`, `olive`, `sepia`                                                                         | `zinc`           | Neutral ramp the page, cards and borders are drawn from.                                                                                                       |
| `tintWithAccent`      | `off`, `on`                                                                                                                                                                        | `off`            | Mixes the accent hue into the neutral ramp.                                                                                                                    |
| `signalColor`         | `none`, `red`, `coral`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `neutral` | `none`           | A second accent for marks that must not read as the primary. `none` repeats the accent.                                                                        |
| `glassTransparency`   | `low`, `medium`, `high`                                                                                                                                                            | `medium`         | Under Glass and the styles that extend it: how much of the page cards, popups and dialogs let through; `high` is the most. Stored under `theme-glass-opacity`. |
| `glassBlur`           | `none`, `low`, `medium`, `high`                                                                                                                                                    | `medium`         | Under Glass and the styles that extend it: the backdrop blur of cards, chrome, popups, dialogs and the scrim; `none` turns every glass backdrop off.           |
| `font`                | a font name                                                                                                                                                                        | `hanken-grotesk` | Body typeface.                                                                                                                                                 |
| `headingFont`         | `body` or a font name                                                                                                                                                              | `body`           | Typeface of `h1` to `h3` and the `font-heading` utility. `body` keeps the body face.                                                                           |
| `radius`              | `sharp`, `subtle`, `rounded`, `pill`                                                                                                                                               | `rounded`        | Corner radius scale.                                                                                                                                           |
| `density`             | `compact`, `cozy`, `comfortable`, `spacious`                                                                                                                                       | `cozy`           | Control height and spacing scale.                                                                                                                              |
| `fontSize`            | `small`, `medium`, `large`, `extra-large`                                                                                                                                          | `medium`         | Root font size scale.                                                                                                                                          |
| `contrast`            | `low`, `standard`, `high`                                                                                                                                                          | `standard`       | Page-to-card separation and the strength of decorative edges.                                                                                                  |
| `darkAccentChroma`    | `calm`, `standard`, `vivid`                                                                                                                                                        | `standard`       | How saturated the accent reads in dark mode.                                                                                                                   |
| `elevation`           | `flat`, `standard`, `high`                                                                                                                                                         | `standard`       | Shadow depth of raised surfaces.                                                                                                                               |
| `outerGlow`           | `none`, `subtle`, `balanced`, `vivid`                                                                                                                                              | `none`           | Halo cast outward from raised surfaces.                                                                                                                        |
| `innerGlow`           | `none`, `subtle`, `balanced`, `vivid`                                                                                                                                              | `none`           | Rim light bled inward on raised surfaces.                                                                                                                      |
| `backgroundStyle`     | `solid`, `gradient`                                                                                                                                                                | `solid`          | Page canvas: a solid fill or a gradient.                                                                                                                       |
| `backgroundIntensity` | `neutral`, `subtle`, `balanced`, `vivid`, `intense`                                                                                                                                | `vivid`          | How loud the gradient canvas is. It also caps the page colour's saturation, under Solid too, where the switcher hides it.                                      |
| `gradientPattern`     | `blobs`, `aurora`, `spotlight`, `mesh`, `dots`, `grain`                                                                                                                            | `blobs`          | Shape the gradient canvas paints.                                                                                                                              |
| `sidebarSelection`    | `auto`, `chip`, `pill`, `tile`, `frosted`, `tint`, `accent`, `rule`, `key`, `tab`                                                                                                  | `auto`           | Look of the current nav row. `auto` follows the `navSelection` signature.                                                                                      |

## Colour

The engine writes its colour tokens inline on the document root, where no stylesheet rule can replace them. A definition has no way to set one, and should not try through app CSS either. Choose colours through the axes (`accentColor`, `surfaceColor`, `tintWithAccent`, `signalColor`, `contrast`, `darkAccentChroma`) and refer to the tokens in values.

Each colour token holds the three channels of an HSL colour, not a colour, so wrap it: `hsl(var(--primary))`, or `hsl(var(--primary) / 0.12)` for an alpha. A bare `var(--primary)` where a colour is expected is invalid CSS. The config check warns about it: `var(--primary) is an HSL channel triplet; write hsl(var(--primary))`. This holds inside `color-mix()` too: write `color-mix(in oklab, hsl(var(--primary)) 20%, transparent)`.

The tokens a definition usually reads:

- The ramps, twelve steps each, from the step nearest the page to the step nearest the text: `--neutral-1` to `--neutral-12` and `--primary-1` to `--primary-12`.
- Surfaces and text: `--background`, `--foreground`, `--card`, `--popover`, `--muted`, `--muted-foreground`, `--surface-sidebar`, `--surface-header`.
- Lines: `--border`, `--border-subtle`, `--border-strong`, `--sidebar-border`.
- The accent: `--primary` (the accent itself), `--primary-fill` and `--primary-foreground` (a solid fill and the text on it), `--primary-text` (accent-coloured text on a neutral surface).
- The signal colour, a second accent: `--signal-fill`, `--signal-foreground`, `--signal-text`, `--signal-subtle`. They repeat the accent while `signalColor` is `none`.
- The status colours, each in the forms `-subtle`, `-edge`, `-text`, `-solid` and `-solid-foreground`: `--destructive-solid`, `--success-text`, `--warning-edge`, `--info-subtle` and so on.

Rules worth knowing before you write a value:

- There is no bare `--destructive`, `--success`, `--warning` or `--info`. A value that names one resolves to nothing. Use the `-solid` form for a fill and the `-text` form for text.
- A few tokens carry an alpha of their own: `--sidebar-border`, `--sidebar-hover-bg` and `--sidebar-active-bg` in dark mode and under an inverse or accent rail, and the four border tokens under `hairlines: "alpha"`. Wrap them as `hsl(var(--border))` and do not add a second alpha, since `hsl(var(--border) / 0.5)` is then invalid.
- A literal colour such as `#0b3d91` is accepted, but it does not follow the accent, the neutral, the mode or the contrast axis. The built-in definitions use no literal but black, white and `transparent`, and take every hue from a token. A shadow tinted like the page, for example, is `hsl(var(--foreground) / 0.2)`.
- The engine solves text against the surfaces it emits: 4.5:1 for text and 3:1 for field edges and marks. It does not know your paint tokens. When a token puts another colour under text (`chromeRailFill`, `shellGroundFill`, `dialogFill`, `bannerFill`, `navSelectionFill`, a card with a low `surfaceFillAlpha` over a canvas), check those ratios on that ground yourself, in both modes.
- For a shadow token that should draw nothing, write `0 0 transparent`, not `none`. The kit joins several shadow tokens in one `box-shadow` list, and `none` inside a list makes the whole declaration invalid.
- Write a radius token as an expression of `--radius` or `--radius-control`, such as `calc(var(--radius) * 1.5)`, so the user's radius axis keeps reaching the component. A fixed length ignores the axis. For a step below the surface radius, keep a floor as the kit does, `max(calc(var(--radius) - 4px), calc(var(--radius) / 2))`, or the subtle step reaches 0. For a capsule, use `var(--radius-pill)`: a pill at every step but sharp, where it squares with the other controls.

## Paint tokens

A definition may set these 85 paint tokens and no others. `darkraise-ui/theme-config` exports the list as `PAINT_TOKENS`. Every token has a kit default that draws the component as it looks with no style, so a definition sets only what it changes.

Tokens that follow an axis are not in the list: control height and spacing (the `density` axis), the elevation shadows, `--radius` itself, the canvas. Steer those through `defaults` or `axes`.

The Value column uses these kinds:

- **colour**: one CSS colour. **colour only** marks a token whose name suggests a fill but which takes a single colour: the kit reads it where a gradient is not valid.
- **background**: anything the `background` property takes, so a colour, a gradient or several layers.
- **background image**: a gradient or `none`, laid over a fill the component keeps.
- **shadow list**: one or more `box-shadow` shadows, or `0 0 transparent` for none.
- **backdrop filter**: a `backdrop-filter` value, or `none`.
- **length**: a radius or a height.
- **font weight**, **letter spacing**, **number from 0 to 1**, **blend mode**: as named.

### Buttons

| Schema name           | CSS property           | Value              | Paints                                                                                                                                                                                                                                             |
| --------------------- | ---------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `buttonEdge`          | `--btn-edge`           | shadow list        | Inner edge lines of the primary and destructive buttons, drawn ahead of their drop shadow.                                                                                                                                                         |
| `buttonSheen`         | `--btn-sheen`          | background image   | Gradient laid over the fill of the primary and destructive buttons.                                                                                                                                                                                |
| `buttonShadow`        | `--btn-shadow`         | shadow list        | Drop shadow of the primary button.                                                                                                                                                                                                                 |
| `buttonBorder`        | `--btn-border`         | colour             | Border of the primary and destructive buttons. The kit default is `transparent`.                                                                                                                                                                   |
| `buttonDangerShadow`  | `--btn-danger-shadow`  | shadow list        | Drop shadow of the destructive button. The kit default is the value of `buttonShadow`.                                                                                                                                                             |
| `buttonNeutralEdge`   | `--btn-neutral-edge`   | shadow list        | Inner edge lines of the outline and secondary buttons, and of the controls that share their face: outline and pressed toggles and the current pagination link.                                                                                     |
| `buttonNeutralSheen`  | `--btn-neutral-sheen`  | background image   | Gradient laid over the fill of the outline and secondary buttons.                                                                                                                                                                                  |
| `buttonNeutralShadow` | `--btn-neutral-shadow` | shadow list        | Drop shadow of the outline and secondary buttons and of the same toggles and pagination link.                                                                                                                                                      |
| `buttonNeutralFill`   | `--btn-neutral-fill`   | colour only        | Fill of the outline button. The kit default is `transparent`. The secondary button keeps its own fill, except under `buttonStyle: "glass"`, where it is the card colour at the card plane's alpha, and under `soft`, where it is the neutral well. |
| `buttonNeutralBorder` | `--btn-neutral-border` | colour             | Border of the outline and secondary buttons and of pagination links. Left unset, the outline button draws the field edge the engine solves at 3:1.                                                                                                 |
| `buttonWeight`        | `--btn-font-weight`    | font weight        | Label weight of every button.                                                                                                                                                                                                                      |
| `ghostHover`          | `--state-layer-hover`  | number from 0 to 1 | Opacity of the hover wash on buttons, toggles, tab triggers and the small buttons inside fields. The kit default is `0.08`.                                                                                                                        |

### Fields and checkables

| Schema name          | CSS property             | Value       | Paints                                                                                                                                                                                                                                                                                   |
| -------------------- | ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fieldShadow`        | `--field-shadow`         | shadow list | Shadow of a field at rest, for example an inset well.                                                                                                                                                                                                                                    |
| `fieldFocusRing`     | `--field-focus-ring`     | shadow list | Ring of a focused field, drawn ahead of `fieldShadow`.                                                                                                                                                                                                                                   |
| `fieldFocusBorder`   | `--field-focus-border`   | colour      | Border of a focused field.                                                                                                                                                                                                                                                               |
| `fieldFocusFill`     | `--field-focus-fill`     | colour only | Wash laid over the fill of a focused field. The kit default is `transparent`.                                                                                                                                                                                                            |
| `checkWellShadow`    | `--check-well-shadow`    | shadow list | Shadow of an unchecked checkbox, radio button and switch track.                                                                                                                                                                                                                          |
| `checkedBorder`      | `--check-checked-border` | colour      | Border of a checked checkbox.                                                                                                                                                                                                                                                            |
| `checkRadius`        | `--check-radius`         | length      | Corner radius of a checkbox.                                                                                                                                                                                                                                                             |
| `switchRadius`       | `--switch-radius`        | length      | Corner radius of a switch track. Its thumb follows it.                                                                                                                                                                                                                                   |
| `thumbShadow`        | `--thumb-shadow`         | shadow list | Shadow of the slider, angle slider and switch thumbs.                                                                                                                                                                                                                                    |
| `thumbFill`          | `--thumb-fill`           | colour only | Fill of the slider, angle slider and switch thumbs. Left unset, each thumb keeps its own fill.                                                                                                                                                                                           |
| `trackWell`          | `--track-well`           | shadow list | Shadow of the slider track, the tabs list and the segment group's trough.                                                                                                                                                                                                                |
| `wellFill`           | `--well-fill`            | colour only | Fill of the tabs list, the segment group's trough, the slider and progress tracks, the unchecked switch track (both states under `switchStyle: slide`) and, under `buttonStyle: soft`, the secondary button. Left unset, each keeps its own fill; the kit unsets it under more contrast. |
| `selectedViewFill`   | `--selected-view-bg`     | background  | Face of the selected tab and the selected segment.                                                                                                                                                                                                                                       |
| `selectedViewShadow` | `--selected-view-shadow` | shadow list | Shadow of the selected tab and the selected segment.                                                                                                                                                                                                                                     |
| `segmentRadius`      | `--segment-radius`       | length      | Corner radius of the segment group. Its segments follow it.                                                                                                                                                                                                                              |

### Cards and surfaces

| Schema name        | CSS property           | Value              | Paints                                                                                                                                                                                                                          |
| ------------------ | ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cardEdge`         | `--card-edge`          | shadow list        | Edge shadow of every card, of detached shell regions, and of banners on the card surface.                                                                                                                                       |
| `cardSheen`        | `--card-sheen`         | background image   | Gradient laid over the card fill.                                                                                                                                                                                               |
| `cardBorder`       | `--card-border`        | colour             | Border of a card, of the inset card footer, and of banners on the card surface.                                                                                                                                                 |
| `cardRim`          | `--card-rim`           | background         | A 1px ring painted over the card's border, for example a gradient rim. The kit default is `none`.                                                                                                                               |
| `cardRadius`       | `--card-radius`        | length             | Corner radius of a card. Detached shell regions move with it.                                                                                                                                                                   |
| `surfaceFillAlpha` | `--surface-fill-alpha` | number from 0 to 1 | Opacity of the card colour at the Medium Transparency step, wherever it is painted, and of banner fills. Fills read the derived `--surface-alpha`; see [Transparency and blur](#transparency-and-blur). The kit default is `1`. |
| `surfaceBackdrop`  | `--surface-backdrop`   | backdrop filter    | Backdrop filter of cards and banners.                                                                                                                                                                                           |
| `seam`             | `--seam`               | colour             | The 1px line of a `seam` card divider and a `seam` table head.                                                                                                                                                                  |
| `seamHighlight`    | `--seam-highlight`     | colour             | The 1px line under the seam. The kit default is `transparent`.                                                                                                                                                                  |

### Overlays and dialogs

| Schema name         | CSS property                   | Value              | Paints                                                                                                                                                                                          |
| ------------------- | ------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overlayFillBase`   | `--surface-overlay-base`       | colour             | Fill of popups: menus, popovers, selects, tooltips and toasts. Their arrows are filled with it.                                                                                                 |
| `overlayFillLayers` | `--surface-overlay-layers`     | background layers  | Layers painted over `overlayFillBase`, each one followed by a comma. The kit default is empty.                                                                                                  |
| `overlayFillBlend`  | `--surface-overlay-blend-mode` | blend mode         | A `background-blend-mode` value for those layers.                                                                                                                                               |
| `overlayFillAlpha`  | `--overlay-fill-alpha`         | number from 0 to 1 | Opacity of popups and dialogs at the Medium Transparency step. A style uses it through the derived `--overlay-alpha`, as Glass's `overlayFillBase` and `dialogFill` do. The kit default is `1`. |
| `overlayBorder`     | `--overlay-border`             | colour             | Border of popups and their arrows. Dialogs follow it unless `dialogBorder` is set.                                                                                                              |
| `overlayShadow`     | `--overlay-shadow`             | shadow list        | The whole shadow of popups. The kit default composes the elevation axis's lift, `dropdownShadow` and the glow axes.                                                                             |
| `overlayBackdrop`   | `--overlay-backdrop`           | backdrop filter    | Backdrop filter of popups. The scrim follows it unless `scrimBackdrop` is set.                                                                                                                  |
| `overlayRadius`     | `--overlay-radius`             | length             | Corner radius of popups. Dialogs follow it unless `dialogRadius` is set.                                                                                                                        |
| `dropdownShadow`    | `--shadow-dropdown`            | shadow list        | The style's own part of the popup shadow, inside `overlayShadow`. Also the shadow of chart tooltips and status toasts.                                                                          |
| `dialogFill`        | `--dialog-fill`                | background         | Fill of dialogs, sheets and drawers. The kit default is the popup fill.                                                                                                                         |
| `dialogBorder`      | `--dialog-border`              | colour             | Border of dialogs, sheets and drawers.                                                                                                                                                          |
| `modalShadow`       | `--modal-shadow`               | shadow list        | Shadow of dialogs, sheets and drawers. The kit default is the elevation axis's high shadow.                                                                                                     |
| `dialogRadius`      | `--dialog-radius`              | length             | Corner radius of dialogs, and of the free edge of sheets and drawers.                                                                                                                           |
| `scrim`             | `--scrim`                      | colour only        | The layer behind a dialog, sheet, drawer or tour.                                                                                                                                               |
| `scrimBackdrop`     | `--scrim-backdrop`             | backdrop filter    | Backdrop filter of the scrim.                                                                                                                                                                   |

### Transparency and blur

A translucent style declares two alphas for the Transparency setting's Medium step: `surfaceFillAlpha` for the card plane and `overlayFillAlpha` for popups and dialogs. The kit derives the values that are painted on `:root`:

- `--surface-alpha` is `max(0.2, 1 − (1 − surfaceFillAlpha) × scale)`
- `--overlay-alpha` is `max(0.4, 1 − (1 − overlayFillAlpha) × scale)`

`scale` is `--glass-transparency-scale`: 0.6 at Low, 1 at Medium and 1.5 at High under Glass and the styles that extend it, and 1 everywhere else, so a declared `1` stays opaque at every step. Write every translucent fill of your own from `--surface-alpha` or `--overlay-alpha`, for example `hsl(var(--card) / calc(var(--surface-alpha) * 2 - 1))` for a fainter slab: under more contrast the kit resets both declared alphas to `1`, and the derived values and everything built on them turn opaque with it. The two values are derived where `<html>` declares the alphas, so a `--surface-fill-alpha` you set on an element inside the page is not scaled.

The built-in glass looks declare these Medium alphas:

| Look            | Cards, light | Cards, dark | Popups and dialogs   |
| --------------- | ------------ | ----------- | -------------------- |
| Glass           | 0.55         | 0.6         | 0.6                  |
| Mica Desk       | 0.6          | 0.62        | 0.6                  |
| Smoked Obsidian | 0.58         | 0.62        | 0.85 light, 0.6 dark |
| Milk Glass      | 0.62         | 0.64        | 0.7                  |
| Aurora Night    | 0.5          | 0.58        | 0.55                 |
| Coral Space     | 0.56         | 0.6         | 0.65                 |
| Dusk Haze       | 0.55         | 0.6         | 0.6                  |
| Soft Glass      | 0.64         | 0.62        | 0.46                 |

A fill derived from them carries a floor, `max(<floor>, calc(…))`, so it never turns clear at High: the content panes of Mica Desk (the card colour) and Coral Space (the page colour) are `max(0.35, calc(var(--surface-alpha) * 2 - 1))`, and the flat rails of Milk Glass, Aurora Night and Dusk Haze are `max(0.4, calc(var(--surface-alpha) * k - c))`. Glass and every glass preset edge cards, popups and dialogs with a 1px white rim (0.7 in light mode, 0.14 in dark) and open `cardEdge` with an `inset 0 1px 0` white highlight (0.6 light, 0.08 dark), except where a preset keeps its own: Milk Glass and Aurora Night keep brighter light rims of 0.9 and 0.8 on cards and popups but not dialogs, Dusk Haze a 0.75 light rim on cards only, and its dark popups a rim of the text colour at 0.16; Smoked Obsidian's light highlight is 0.7 and Aurora Night's dark highlight 0.1. The controls inside a pane are frosted: `wellFill` is white at 0.35 (light) and 0.06 (dark), `buttonNeutralFill` is the card colour at `--surface-alpha`, `fieldFill` is `translucent`, and the selected chip on a frosted well is white at 0.75 and 0.14 (`selectedViewFill`) with a 1px `--border-strong` edge (`selectedViewShadow`; in dark mode the edge is mixed 25% toward the text colour), which reaches 3:1 against the well. Under more contrast Glass's `forcedFallback` edges cards, popups and dialogs in `--border`, returns the highlight and the chip edge to opaque kit values and the kit unsets `wellFill`; the chip keeps its white fill inside a well that is then opaque.

Glass's Blur steps size one variable, `--glass-blur` (4px, 8px and 32px; the scrim's `--glass-scrim-blur` is 1px, 2px and 8px), and its None step sets `--glass-backdrop-off` to `none`. Write a backdrop as `var(--glass-backdrop-off, blur(var(--glass-blur)) saturate(140%))`: at None the whole value is the keyword `none`, and at the other steps your own filters follow the blur. `--glass-blur` exists only under Glass and the styles that extend it; in any other style write a fixed `blur(…)` instead, because an undefined variable makes the whole value invalid and the backdrop silently becomes `none`. Never write `blur(0)`: any filter value makes the element a containing block for its fixed-position descendants. While Blur is on, a `position: fixed` element rendered inside a glass card is positioned against the card; the kit's popups, dialogs, toasts and global floating panels render in a portal and are unaffected.

### Chrome and shell

| Schema name           | CSS property              | Value           | Paints                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `chromeRailFill`      | `--chrome-rail-bg`        | background      | Fill of the sidebar and the other rails.                                                                                                                                                                                                                                                                           |
| `chromeBarFill`       | `--chrome-bar-bg`         | background      | Fill of the top bar.                                                                                                                                                                                                                                                                                               |
| `chromeEdge`          | `--chrome-edge`           | colour          | The 1px rule between chrome regions and the border of detached regions.                                                                                                                                                                                                                                            |
| `chromeShadow`        | `--chrome-shadow`         | shadow list     | Shadow of chrome regions.                                                                                                                                                                                                                                                                                          |
| `chromeBackdrop`      | `--chrome-backdrop`       | backdrop filter | Backdrop filter of chrome regions.                                                                                                                                                                                                                                                                                 |
| `chromeCanvas`        | `--chrome-canvas`         | background      | Layer painted behind each chrome region's fill.                                                                                                                                                                                                                                                                    |
| `chromeFlatFill`      | `--chrome-flat-fill`      | background      | Fill of the rails and the bar under the flat shell.                                                                                                                                                                                                                                                                |
| `chromeBarHeight`     | `--chrome-bar-height`     | length          | Height of the top bar. The kit default is `3.5rem`.                                                                                                                                                                                                                                                                |
| `shellGroundFill`     | `--shell-ground-fill`     | background      | The ground the whole shell stands on under the Solid background. It shows in the gutters of the inset, island, floating and framed shells, and behind the content wherever the content pane has no fill of its own. Left unset, the inset and island ground is the page colour recessed 5% toward the text colour. |
| `shellGroundGradient` | `--shell-ground-gradient` | background      | The shell's ground under the Gradient background. Left unset, the shell is clear and the page canvas (the Gradient Pattern at the Background Intensity) shows through. A value with no opaque layer lets the canvas show through it.                                                                               |
| `shellShadow`         | `--shell-shadow`          | shadow list     | Separation shadow of detached regions (the inset content pane, island and floating regions) and of the framed shell's window. Left unset, each shell keeps its own.                                                                                                                                                |
| `shellContentFill`    | `--shell-content-fill`    | background      | Fill of the content pane under the inset, island and floating shells. Left unset, an inset or island pane takes the page colour at `--surface-alpha` on a ground recessed 5% toward the text colour, and a floating pane stays `transparent`.                                                                      |
| `shellContentEdge`    | `--shell-content-edge`    | colour          | Border of the content pane under the inset, island and floating shells. Left unset, it follows `chromeEdge`.                                                                                                                                                                                                       |
| `shellContentShadow`  | `--shell-content-shadow`  | shadow list     | Shadow of the content pane under the inset, island and floating shells. Left unset, it follows `shellShadow`.                                                                                                                                                                                                      |
| `shellFrameEdge`      | `--shell-frame-edge`      | colour          | The 1px ring around the framed shell's window.                                                                                                                                                                                                                                                                     |

### Navigation selection

| Schema name          | CSS property             | Value       | Paints                                                                                                                  |
| -------------------- | ------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `navSelectionFill`   | `--nav-selection-fill`   | background  | Face of the current nav row. Left unset, each selection look paints its own.                                            |
| `navSelectionEdge`   | `--nav-selection-edge`   | colour      | The 1px ring around the current nav row.                                                                                |
| `navSelectionShadow` | `--nav-selection-shadow` | shadow list | Shadow of the current nav row.                                                                                          |
| `navSelectionGlow`   | `--nav-selection-glow`   | shadow list | A second shadow of the current nav row, drawn after `navSelectionShadow`. Only the `frosted` look draws one by default. |
| `navItemRadius`      | `--nav-item-radius`      | length      | Corner radius of nav rows in the sidebar, the top nav and the stacked layout's rail.                                    |

### Status and small radii

| Schema name      | CSS property         | Value       | Paints                                                                               |
| ---------------- | -------------------- | ----------- | ------------------------------------------------------------------------------------ |
| `badgeRadius`    | `--badge-radius`     | length      | Corner radius of a badge.                                                            |
| `bannerRadius`   | `--banner-radius`    | length      | Corner radius of banners and alerts.                                                 |
| `bannerFill`     | `--banner-fill`      | background  | Fill of every banner and alert, whatever its status. Set it only for a neutral face. |
| `bannerBorder`   | `--banner-border`    | colour      | Frame of banners and alerts.                                                         |
| `bannerShadow`   | `--banner-shadow`    | shadow list | Shadow of banners and alerts.                                                        |
| `menuItemRadius` | `--menu-item-radius` | length      | Corner radius of rows in menus, selects, listboxes, comboboxes and the command list. |

### Type

| Schema name            | CSS property                    | Value          | Paints                             |
| ---------------------- | ------------------------------- | -------------- | ---------------------------------- |
| `pageTitleWeight`      | `--type-page-title-weight`      | font weight    | Weight of page titles.             |
| `pageTitleTracking`    | `--type-page-title-tracking`    | letter spacing | Tracking of page titles.           |
| `sectionTitleWeight`   | `--type-section-title-weight`   | font weight    | Weight of section titles.          |
| `sectionTitleTracking` | `--type-section-title-tracking` | letter spacing | Tracking of section titles.        |
| `dialogTitleWeight`    | `--type-dialog-title-weight`    | font weight    | Weight of dialog titles.           |
| `dialogTitleTracking`  | `--type-dialog-title-tracking`  | letter spacing | Tracking of dialog titles.         |
| `uiWeight`             | `--type-ui-weight`              | font weight    | Weight of body and interface text. |
| `figureWeight`         | `--figure-weight`               | font weight    | Weight of the figure in a `Stat`.  |

## Signatures

A signature resolves to the preset's value, else the style's (inherited through `extends`), else the kit default. Each signature except `navSelection` is stamped on the document root as a `data-` attribute with the kebab-case name, such as `data-table-head="ruled"`, and the kit's CSS selects on it. App CSS may select on the same attributes. `useTheme().registry.signaturesFor(style, preset)` returns the resolved values.

`navSelection` is not stamped on the root. It is the look the `sidebarSelection` axis draws at its default, `auto`. A user who picks a look in the switcher, or a layout that passes `selection`, overrides it.

`railTone` and `barTone` also feed the colour engine: under `inverse` and `accent` it solves the rail's or the bar's text, hover and selection colours against the toned fill. The tone decides the surface colour the engine emits; what is painted is still `chromeRailFill` and `chromeBarFill`. If the style sets those to a colour of its own, as Glass and Tactile do for the rail, a preset that changes the tone must set the fill back to `hsl(var(--surface-sidebar))` or `hsl(var(--surface-header))`.

| Signature       | Value               | Draws                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `navSelection`  | `chip` (default)    | A chip in the card colour with a hairline ring and a short shadow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `navSelection`  | `pill`              | A neutral wash with a 3px accent bar at the row's leading edge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `navSelection`  | `tile`              | The chip, with the row's icon on a solid accent tile and a deeper shadow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `navSelection`  | `frosted`           | A translucent white chip that blurs what is behind it, over an accent glow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `navSelection`  | `tint`              | A neutral wash with the label and icon in the accent.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `navSelection`  | `accent`            | An accent wash inside an accent ring.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `navSelection`  | `rule`              | No fill: a full-height 2px accent rule at the leading edge, and the label in the accent.                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `navSelection`  | `key`               | The outline button's face, so the row reads as a pressed key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `navSelection`  | `tab`               | An opaque card face lifted off the rail by a shadow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `navMarker`     | `auto` (default)    | Each selection look keeps its own marker: the bar under `pill`, the rule under `rule`, none under the others.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `navMarker`     | `none`              | No marker under any look.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `navMarker`     | `bar`               | The 3px accent bar under every look.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `navMarker`     | `rule`              | The full-height 2px accent rule under every look.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `railTone`      | `page` (default)    | The rail stands on the page colour in light mode and on the card colour in dark mode (the page colour in both under a frosted style).                                                                                                                                                                                                                                                                                                                                                                                                                |
| `railTone`      | `raised`            | The rail stands on the card colour in both modes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `railTone`      | `inverse`           | A near-black rail in light mode and a rail darker than the page in dark mode, with its text, hover and selection tiers solved on that fill.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `railTone`      | `accent`            | A rail in the accent with white text, its tiers solved on that fill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `barTone`       | `page` (default)    | The top bar stands on the card colour.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `barTone`       | `raised`            | The same as `page`: the bar's surface is already the card colour.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `barTone`       | `inverse`           | A near-black bar in light mode and a bar darker than the page in dark mode, with its own text tiers solved on that fill.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `barTone`       | `accent`            | A bar in the accent with white text, its tiers solved on that fill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `barSpan`       | `content` (default) | The bar sits beside the rail, above the content only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `barSpan`       | `full`              | From 768px up the bar runs the full width above the rails, in the sidebar and stacked layouts.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `barEdge`       | `rule` (default)    | A 1px rule under the bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `barEdge`       | `none`              | No rule under the bar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `barEdge`       | `veil`              | No rule and no fill: content scrolls up beneath the bar, which blurs and tints it. Under more contrast the bar is opaque and ruled again.                                                                                                                                                                                                                                                                                                                                                                                                            |
| `menuHighlight` | `neutral` (default) | The highlighted row takes the neutral wash.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `menuHighlight` | `tint`              | The highlighted row takes the accent at 12% with accent text.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `menuHighlight` | `solid`             | The highlighted row takes the solid accent fill with its foreground.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `menuTone`      | `surface` (default) | Menus are painted as every other popup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `menuTone`      | `inverse`           | Dropdown and context menus are painted in the text colour with the page colour on them.                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `tooltipTone`   | `overlay` (default) | Tooltips are painted as every other popup.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `tooltipTone`   | `inverse`           | Tooltips are painted in the text colour with the page colour on them.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `tooltipTone`   | `accent`            | Tooltips are painted in the accent fill with its foreground.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `labelCase`     | `auto` (default)    | Sidebar group labels and the stacked layout's aside labels are uppercase. Every other label is set as written.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `labelCase`     | `upper`             | Uppercase at every label site: sidebar group labels, table heads, group labels in menus, selects and the command list, and field labels, which include the labels of checkboxes, radio buttons and switches.                                                                                                                                                                                                                                                                                                                                         |
| `labelCase`     | `none`              | Every label is set as written, sidebar group labels included.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `labelCase`     | `lower`             | Lowercase at every label site listed under `upper`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `figureFamily`  | `sans` (default)    | Figures are set in the body face.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `figureFamily`  | `mono`              | `Stat` values and end-aligned table cells are set in the monospace face.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `cardDivider`   | `none` (default)    | Only a card that sets the `divided` prop rules its header and footer off.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `cardDivider`   | `hairline`          | Every card rules its header and footer off with 1px lines.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `cardDivider`   | `seam`              | Every card rules its header and footer off with a seam: the `seam` line over the `seamHighlight` line.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `cardFooter`    | `plain` (default)   | The footer sits on the card.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `cardFooter`    | `inset`             | The footer sits on the page colour, ruled off from the content and flush with the card's lower corners.                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `bannerMark`    | `stripe` (default)  | A 4px leading stripe in the status colour on a framed, tinted box.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `bannerMark`    | `rule`              | A 3px leading rule in the status colour and nothing else: no frame, and no fill unless `bannerFill` sets one.                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `bannerMark`    | `icon`              | No stripe: the tinted box is framed in its status colour at 30%.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `bannerMark`    | `lamp`              | No stripe and no icon: a lit dot in the status colour. A neutral or info banner lights it in the signal colour.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `bannerSurface` | `tint` (default)    | A banner is filled with its status tint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `bannerSurface` | `card`              | A banner takes the card's fill, border and edge. Its border is the card border on all four sides.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `badgeStyle`    | `subtle` (default)  | A status badge is a tinted fill inside a frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `badgeStyle`    | `tint`              | The tinted fill without the frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `badgeStyle`    | `chip`              | Status text on a neutral chip, without a frame.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `badgeStyle`    | `outline`           | The frame and the status text, without a fill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `fieldFill`     | `well` (default)    | A field is filled one step darker than the surface it sits on.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `fieldFill`     | `surface`           | Inside a card or a popup a field takes that surface's own colour. On the bare page it keeps the well.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `fieldFill`     | `translucent`       | A field lets the canvas show through as far as the card plane does, so it thins with the Transparency step: in light mode it is the card colour and lets through 1/1.125 of what the card lets through; in dark mode it is a 6% wash of the text colour once the card lets through 40% or more, and turns into the card colour toward an opaque card. Where the card plane is opaque (outside Glass, and under more contrast) it paints the card, as `surface` does inside a card.                                                                   |
| `fieldBorder`   | `box` (default)     | A field has a border on all four sides.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `fieldBorder`   | `bottom`            | Only the bottom edge is drawn, and the bottom corners are square.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `fieldBorder`   | `none`              | The top and side borders are not drawn. The bottom edge stays.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `tableHead`     | `band` (default)    | The head row is a muted band.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `tableHead`     | `plain`             | No band.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `tableHead`     | `ruled`             | No band: the head is ruled off with the strong border colour.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `tableHead`     | `seam`              | No band: the head is ruled off with a seam.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `rowSelection`  | `tint` (default)    | A selected row takes the muted fill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `rowSelection`  | `accent`            | A selected row takes the accent at 12%.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `rowSelection`  | `stripe`            | A selected row takes the muted fill and a 3px accent stripe at its leading edge.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `dialogHeader`  | `plain` (default)   | The header sits on the dialog's fill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `dialogHeader`  | `band`              | The header is an edge-to-edge band in the page colour with a rule under it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `dialogFooter`  | `plain` (default)   | The footer sits on the dialog's fill.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `dialogFooter`  | `ruled`             | An edge-to-edge rule above the footer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `dialogFooter`  | `band`              | The footer is an edge-to-edge band in the page colour with a rule above it. From 640px up its buttons share the width.                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ghostButton`   | `wash` (default)    | A ghost button shows a wash on hover.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `ghostButton`   | `link`              | A ghost button with a label is accent text, underlined on hover, with no wash. Icon-only ghost buttons keep the wash.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `avatarShape`   | `round` (default)   | Avatars are circles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `avatarShape`   | `square`            | Avatars are squares rounded to half the radius.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `buttonStyle`   | `solid` (default)   | Buttons as the tokens and the other signatures draw them. Every value restyles the default, destructive, secondary and outline variants at every size; ghost and link buttons follow `ghostButton`.                                                                                                                                                                                                                                                                                                                                                  |
| `buttonStyle`   | `key`               | A hardware key: a face lit from its top 35%, ending above the label, over a 2px base edge in the face colour darkened by 30%, with a soft drop shadow. Pressed, the face moves down 1px and the base shrinks to 1px, so neighbours never move, instantly under reduced motion. Secondary and outline buttons take the base in the strong border colour. `buttonEdge`, `buttonNeutralEdge` and the sheens still apply on top; the look's drop shadows (`buttonShadow`, `buttonDangerShadow` and `buttonNeutralShadow`) are replaced by the key's own. |
| `buttonStyle`   | `soft`              | Default and destructive buttons drop the solid fill at rest: an accent tint (`--primary-3` in light mode, `--primary-4` in dark) under accent text, and the destructive tint under destructive text; hover takes the accent tint one step deeper and washes the destructive tint toward the page. A press washes both faces toward the page. Secondary is the neutral well with muted text, frosted with the other wells where the look sets `wellFill`; outline takes an accent edge and accent text.                                               |
| `buttonStyle`   | `glass`             | Default and destructive keep their fill and gain a sheen on the top 35% of the face, ending above the label, an inset top highlight and a soft accent-tinted shadow; the sheen replaces `buttonSheen`, and the look's `buttonEdge`, `buttonShadow` and `buttonDangerShadow` are dropped. Secondary and outline become frosted capsules with a 1px light rim and an inset top highlight in place of `buttonNeutralEdge`: secondary is the card colour at the card plane's alpha, outline is filled with `buttonNeutralFill`.                          |
| `iconButton`    | `square` (default)  | Icon-size buttons take the control radius. The signature changes only the radius of icon-size buttons, in every variant, Pagination's page links and Calendar's month arrows included.                                                                                                                                                                                                                                                                                                                                                               |
| `iconButton`    | `round`             | Icon-size buttons are circles (`--radius-pill`). Under the `sharp` radius step they stay square, like the controls around them.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `switchStyle`   | `pill` (default)    | A switch is a pill track with a round thumb inside it. Every value restyles every switch.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `switchStyle`   | `track`             | A 14px track centred in the unchanged 36×20 box, under a 20px thumb that overhangs it. On, the track is the accent tint (`--primary-4`) and the thumb the accent text colour (`--primary-text`), which keeps 3:1 against the tint where `--primary` would not; off, the thumb is the card tone ringed in the strong border colour (`--border-strong`).                                                                                                                                                                                               |
| `switchStyle`   | `slide`             | A recessed rectangular slot (`--check-well-shadow`; its radius at most a quarter of `--radius`) with a ridged rectangular thumb 18px wide, ringed in the strong border colour, and a 6px lamp in the part of the slot the thumb has left: the accent text colour (`--primary-text`) with a 4px glow when on, which keeps 3:1 against the slot, and the field edge (`--field-edge`) when off.                                                                                                                                                         |
| `switchStyle`   | `marked`            | One glyph, 9px semibold, in the half of the track the thumb leaves free: an `O` at the inline end in muted text when off, an `I` at the inline start in the accent's foreground when on, each clearing 4.5:1 on its track.                                                                                                                                                                                                                                                                                                                           |
| `checkStyle`    | `box` (default)     | Checkboxes and radio buttons as the tokens draw them. Every value restyles every checkbox and every radio button outside a segment group; segment groups follow `tabStyle`.                                                                                                                                                                                                                                                                                                                                                                          |
| `checkStyle`    | `outline`           | A checked checkbox is unfilled, so the card or page shows through, under a 1.5px accent edge with an accent tick, or an accent bar when indeterminate. A chosen radio button is a 1.5px accent ring around an empty centre with an accent dot half the box across.                                                                                                                                                                                                                                                                                   |
| `checkStyle`    | `round`             | Checkboxes are circles (`--radius-pill`), square under the `sharp` radius step; the checked fill and tick are those of `box`.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `tabStyle`      | `well` (default)    | Tab lists and segment groups sit in a muted well with a raised chip on the current item. Every value restyles tab lists and segment groups whose `variant` is `default`, in both orientations and with or without `color="accent"`; the `outline`, `underline` and `enclosed` variants keep their own look. No value changes an item's size or the strip's padding; `outline` closes the gaps between items.                                                                                                                                         |
| `tabStyle`      | `underline`         | No well: a 2px accent bar along the current item's bottom edge (its inline-end edge when vertical), reaching across the strip's padding to a 1px border baseline. With the Tabs `border` prop at any tier but `none`, the strip's frame takes the tier's colour and `--radius`, and its bottom (inline-end when vertical) edge is the baseline; `none` keeps the baseline.                                                                                                                                                                           |
| `tabStyle`      | `pill`              | No well: the current item is an accent pill (`--primary-fill`) with its foreground, edged 1px in `--primary` so the pill keeps 3:1 against the page where the fill is light; the others take muted text and a wash on hover.                                                                                                                                                                                                                                                                                                                         |
| `tabStyle`      | `outline`           | A 1px strong-border frame drawn inside the strip's padding, with 1px dividers between cells that meet, the gaps between items closed; the current cell is the accent tint (`--primary-3` in light mode, `--primary-4` in dark) under accent text, edged in the accent so it reaches 3:1 against the page. The Tabs `border` prop recolours the frame and the dividers with its tier instead of framing the strip a second time; `none` clears both, leaving the current cell's accent edge.                                                          |
| `sliderStyle`   | `round` (default)   | A rounded track and range with a round thumb, and a rounded progress bar. Every value restyles every slider, in both orientations, with several thumbs and inverted, and every progress bar, indeterminate included.                                                                                                                                                                                                                                                                                                                                 |
| `sliderStyle`   | `bar`               | Square ends on the track, the range and the progress bar; the thumb is a 6×18 accent bar (18×6 when vertical), its 24px hit area unchanged.                                                                                                                                                                                                                                                                                                                                                                                                          |
| `sliderStyle`   | `knob`              | The 8px track is recessed, under a 22px domed thumb with an 8px accent centre dot. A progress bar is a 10px recessed bar.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `sliderStyle`   | `ruled`             | A 2px hairline track in the strong border colour with a tick every 10% below it (beside it when vertical), or the slider's own step marks as 1px ticks where it shows them; the range is an accent hairline and the thumb a 2×18 accent needle with a triangular head (18×2 when vertical). A progress bar is a 2px hairline with an accent fill.                                                                                                                                                                                                    |

## Precedence

The provider, the pre-render script and the layouts all resolve in this order.

The style is the stored value, else the app's `defaults.style`, else `quiet`. The preset is the stored value if it belongs to that style, else `defaults.preset` if it belongs to that style, else `base`. Then, for every other axis, the first of these that exists:

1. The user's own value: a pick in the theme switcher, a `useTheme()` setter, or a synced payload.
2. The active preset's `axes`.
3. The active style's `defaults`, its own and those it inherits through `extends`.
4. The app's `defaults`.
5. The kit's registry default.

Signatures resolve preset, then style, then kit default. There is no user layer for signatures apart from `sidebarSelection`.

The shell style of a layout is the first of: its `shellStyle` prop, the user's stored pick, the active preset's `shellStyle`, its `defaultShellStyle` prop, `classic`.

Picking a preset in the switcher, or with `setPreset`, stores the preset and its style. Picking a style stores the style and resets the preset to `base`. Either pick clears the user's stored value on every axis the new preset or style sets, and the stored shell style when the preset sets `shellStyle`, so the pick shows as designed. Mode and every axis the pick does not set keep the user's value.

If `defaults.preset` names a preset of another style than `defaults.style`, the provider warns (`themeConfig.defaults.preset "<name>" belongs to style "<its style>", not "<the default style>"; using "base".`) and uses `base`, and `darkraisePrerender` fails the build with the same finding. A style name in `defaults.preset`, which is what 6.x took there, warns and is ignored.

## The theme switcher

The Style control lists the four built-in styles, then the config's styles in config order.

Directly under it, the Preset control lists `base`, then the presets of the active style: built-in ones first, then the config's in config order. Built-in presets are labelled through the labels system (`labels.theme.presets`), so a language pack can translate them (the kit's own packs keep the sixteen names as written and translate `base`); a config preset shows its `label`. The control is hidden when it would offer `base` alone, and when `switcher.axes.preset` is `false`.

`switcher.presets` limits what the control offers:

```ts
import { defineThemeConfig } from "darkraise-ui/theme-config"

export const themeConfig = defineThemeConfig({
  defaults: { style: "quiet", preset: "paper-ink" },
  switcher: {
    enabled: true,
    presets: ["paper-ink", "linen-teal", "mica-desk"],
  },
})
```

It is one list for all styles: with this config the control offers `base`, Paper & Ink and Linen & Teal under Quiet, `base` and Mica Desk under Glass, and is hidden under Flat and Tactile, where only `base` is left. Left out, every preset of the active style is offered. `base` is always offered, and so is the active preset even when the list leaves it out, so the control always shows what is applied. A name that is not a preset is ignored with a warning outside production builds: `themeConfig.switcher.presets "<name>" is not a preset`.

While the user has a value of their own on an axis the active preset or style sets, or a stored shell style under a preset that sets one, a **Reset to preset** action appears under the Preset control. It belongs to that control, so it is not shown where the control is hidden. It clears those stored values, so the preset's and the style's apply again, and it clears the stored shell style when the preset sets `shellStyle`. Mode, style and preset stay as they are. The same action is available in code:

```tsx
import { Button } from "darkraise-ui/components/button"
import { useTheme } from "darkraise-ui/theme"

export function ResetThemeButton() {
  const { canResetToPreset, resetToPreset } = useTheme()
  return (
    <Button
      variant="ghost"
      disabled={!canResetToPreset}
      onClick={resetToPreset}
    >
      Reset to preset
    </Button>
  )
}
```

Two more controls depend on the definitions. The Signal Color control is hidden while the signal colour is `none`, and appears when a preset, a style or the user sets one. The Glass transparency and blur controls appear under Glass and under any style that extends it.

## Delivery

The built-in styles and presets are part of `darkraise-ui/styles.css`. An app that defines nothing of its own loads no other theme CSS.

### With the Vite plugin

`darkraisePrerender({ config, nonce })` from `darkraise-ui/vite` adds two elements to `index.html`:

- When the config defines a style, a preset or a font, a `<style data-darkraise-theme="<hash>">` element holding the compiled CSS of those definitions.
- A script that runs before the app. It reads the stored settings, resolves them in the order under [Precedence](#precedence), and stamps the mode, every axis attribute and every signature attribute on the document root. It also applies the engine's colours from a cache when the settings and the definitions have not changed. The first paint therefore already has the user's theme and your style.

Pass the config the app gives `ThemeProvider`, so both resolve alike. The plugin validates the config when Vite starts and fails on any error. Vite restarts the dev server when the config file changes, because `vite.config.ts` imports it.

`nonce` puts a CSP nonce on both elements. The plugin writes it into `index.html` once, at build time. A nonce is meant to differ on every response, so a build-time value is only useful as a placeholder that your server replaces in the HTML it serves. If the server cannot rewrite the HTML, render the two elements yourself as shown below.

### Without the plugin

When the page has no `<style data-darkraise-theme>` element for the config's definitions, `ThemeProvider` adds one itself when it mounts. It takes a `nonce` prop for that element. Nothing themes the document before React runs in this setup, so the first paint can show the kit's default look for a moment before the stored theme and your style apply.

### Server-rendered apps

A server that renders the document can emit both elements itself, with a nonce of its own for each response.

```ts
// server/theme-head.ts
import {
  resolveRegistry,
  themePrerenderScript,
  themeStyleText,
} from "darkraise-ui/theme-config"
import { themeConfig } from "../src/theme.config"

const hash = resolveRegistry(themeConfig).hash
const styleText = themeStyleText(themeConfig)
const scriptText = themePrerenderScript(themeConfig)

/** The theme elements for one response's `<head>`. */
export function themeHead(nonce: string): string {
  const style =
    hash === ""
      ? ""
      : `<style data-darkraise-theme="${hash}" nonce="${nonce}">${styleText}</style>`
  return `${style}<script nonce="${nonce}">${scriptText}</script>`
}
```

`themeStyleText(config)` is the stylesheet the plugin injects and `themePrerenderScript(config)` the script. The style element must carry `data-darkraise-theme` set to `resolveRegistry(config).hash`: that is how `ThemeProvider` recognises it and adds no second copy. The hash is the empty string when the config defines nothing, and then no style element is needed. A definition with an error is left out of the stylesheet, so check `resolveRegistry(config).issues` in your build or tests.

## Layers

`darkraise-ui/styles.css` opens with one statement that fixes the order of its cascade layers, and every stylesheet compiled from a config opens with the same statement:

```css
@layer properties, theme, base, style.base, style.mode, style.when, style.preset, style.fallback, components, utilities, overrides;
```

A later layer beats an earlier one whatever the selectors. Definitions compile into the `style.*` layers:

1. `base` holds the kit default of every paint token.
2. `style.base` holds a style's `shared` and `light` values, and the font rules.
3. `style.mode` holds a style's `dark` values.
4. `style.when` holds a style's `when` entries.
5. `style.preset` holds a preset's values, under `[data-preset="<name>"]`.
6. `style.fallback` holds the kit's reset and each style's `forcedFallback`, inside the more-contrast media query.

This order is the reason for the two preset rules above: a preset beats its style's `dark` and `when` values because its layer comes later.

`components`, `utilities` and `overrides` come after all of them. So the app can replace a paint token, whatever the active style and preset, with a rule in `overrides`:

```css
@import "darkraise-ui/styles.css";

@layer overrides {
  :root {
    --card-radius: 0.25rem;
  }
}
```

A rule outside any layer beats every layer, `overrides` included.

**Not supported:** importing the kit stylesheet inside a layer of your own, as in `@import "darkraise-ui/styles.css" layer(vendor)`. That nests all of the kit's layers under `vendor`, while a stylesheet compiled from your config is injected at the top level with top-level `style.*` layers, and the two no longer order as the statement says. There is no option to prefix the layers.

## What the vocabulary does not do

Each of these follows from how the kit reads a token or a signature. Knowing them saves a round of debugging.

- **A preset cannot set a token its style sets in a `when` entry**, and its `shared` value replaces its style's `dark` value. Both are described under [Defining a preset](#defining-a-preset).
- **`shellContentFill` paints only where the content pane is detached**: under the inset, island and floating shells. Under the classic, flat and framed shells the content has no fill of its own, and page text sits directly on `shellGroundFill`. The user can switch shells in any layout that shows the layout switcher. A `shellGroundFill` in a chrome tone, with a lighter `shellContentFill` over it, therefore puts page text on the chrome tone in those three shells: check text contrast on the ground itself, or keep the ground close to the page colour. A layout that sets the `shellStyle` prop pins the shell and removes the case.
- **`labelCase: "upper"` reaches every label**, including the labels of checkboxes, radio buttons and switches, which are often whole sentences. There is no value for uppercase table heads only.
- **`bannerSurface: "card"` draws the card border on all four sides**, so the leading stripe of `bannerMark: "stripe"` and the rule of `bannerMark: "rule"` lose their status colour. Pair the card surface with the `icon` or `lamp` mark.
- **`buttonDangerShadow` defaults to the value of `buttonShadow`.** A primary button shadow tinted with the accent reaches the destructive button unless you set `buttonDangerShadow` as well.
- **The field edge is solved for a card sheen of a known shape.** In dark mode an elevated card lightens its face, and the edge of a field on it is solved to hold 3:1 against a face that carries at most 9.5% white: 8% from the highest elevation and the rest for a sheen. Keep the white a `cardSheen` adds in dark mode at or under 1.6%. The built-in definitions write a card sheen as `none` or as `linear-gradient(180deg, rgb(255 255 255 / a), ...)`, top down and starting with its white alpha, which is the shape the kit's own check reads.
- **`overlayShadow` and `buttonNeutralBorder` are available, and no built-in definition sets them.** `overlayShadow` is the whole popup shadow, and its kit default joins the elevation axis's lift, `dropdownShadow` and the two glow axes. Setting it removes the user's elevation and glow from every popup, so set `dropdownShadow` and keep the composition. `buttonNeutralBorder` replaces the outline button's border, which by default is the field edge the engine solves at 3:1 against the button's ground. A fainter colour takes a control boundary under 3:1.
- **`buttonStyle: "glass"` takes its frost from the host style.** Its secondary capsule is the card colour at the card plane's alpha (`--surface-alpha`), and its outline capsule is filled with `buttonNeutralFill`, which Glass sets to the same. Under a style whose card plane is opaque the secondary capsule is opaque, an outline capsule under a style that leaves `buttonNeutralFill` at its `transparent` default stays unfilled, and the value adds no backdrop filter of its own.
- **`fieldBorder: "bottom"` and `"none"` keep the bottom edge.** No value removes the 3:1 bottom edge of a field.
- **Only the tokens listed under [`forcedFallback`](#forcedfallback) are reset under more contrast.** A preset has no `forcedFallback`, so a translucent value a preset writes into another token, such as `shellContentFill` or `dialogFill`, stays translucent. Derive its alpha from `--surface-alpha` or `--overlay-alpha`, which turn opaque when the kit resets the declared alphas to `1`, as Mica Desk does below, or put the reset in the style's `forcedFallback`.
- **Background Intensity acts under Solid too.** It caps the saturation of the page colour under both backgrounds; the switcher shows it only under Gradient, where its other half, the canvas's strength, shows.
- **A `role` on a font changes nothing by itself**, and a label on a config style, preset or font is shown as written in every language.

## Built-in presets

The kit registers sixteen presets. Their names are taken: a config style, preset or font may not use one.

| Name              | Label            | Style   | Shell style |
| ----------------- | ---------------- | ------- | ----------- |
| `paper-ink`       | Paper & Ink      | Quiet   | `flat`      |
| `linen-teal`      | Linen & Teal     | Quiet   | `flat`      |
| `red-graphite`    | Red Graphite     | Quiet   | not set     |
| `studio-green`    | Studio Green     | Quiet   | not set     |
| `pastel-soft`     | Pastel Soft-Flat | Flat    | `flat`      |
| `forest-lime`     | Forest & Lime    | Flat    | `framed`    |
| `braun-panel`     | Braun Panel      | Tactile | `framed`    |
| `dark-instrument` | Dark Instrument  | Tactile | not set     |
| `card-stock`      | Card Stock       | Tactile | `inset`     |
| `mica-desk`       | Mica Desk        | Glass   | `inset`     |
| `smoked-obsidian` | Smoked Obsidian  | Glass   | not set     |
| `milk-glass`      | Milk Glass       | Glass   | `flat`      |
| `aurora-night`    | Aurora Night     | Glass   | `flat`      |
| `coral-space`     | Coral Space      | Glass   | `inset`     |
| `dusk-haze`       | Dusk Haze        | Glass   | `flat`      |
| `soft-glass`      | Soft Glass       | Glass   | `island`    |

Each built-in style and preset picks its control anatomy (see [Signatures](#signatures)); a preset writes only the picks that differ from its style's:

| Look             | `buttonStyle` | `iconButton` | `switchStyle` | `checkStyle` | `tabStyle`  | `sliderStyle` |
| ---------------- | ------------- | ------------ | ------------- | ------------ | ----------- | ------------- |
| Quiet            | `solid`       | `square`     | `pill`        | `box`        | `well`      | `round`       |
| Paper & Ink      | `solid`       | `square`     | `track`       | `outline`    | `underline` | `ruled`       |
| Linen & Teal     | `soft`        | `round`      | `pill`        | `box`        | `pill`      | `round`       |
| Red Graphite     | `solid`       | `square`     | `marked`      | `box`        | `outline`   | `bar`         |
| Studio Green     | `soft`        | `square`     | `track`       | `round`      | `underline` | `knob`        |
| Flat             | `solid`       | `square`     | `pill`        | `box`        | `underline` | `round`       |
| Pastel Soft-Flat | `soft`        | `round`      | `pill`        | `round`      | `pill`      | `knob`        |
| Forest & Lime    | `solid`       | `round`      | `track`       | `box`        | `pill`      | `round`       |
| Tactile          | `key`         | `square`     | `pill`        | `box`        | `well`      | `knob`        |
| Braun Panel      | `key`         | `square`     | `slide`       | `box`        | `outline`   | `bar`         |
| Dark Instrument  | `key`         | `square`     | `marked`      | `box`        | `outline`   | `ruled`       |
| Card Stock       | `key`         | `square`     | `slide`       | `outline`    | `well`      | `bar`         |
| Glass            | `glass`       | `round`      | `pill`        | `round`      | `well`      | `knob`        |
| Mica Desk        | `solid`       | `square`     | `track`       | `box`        | `underline` | `knob`        |
| Smoked Obsidian  | `glass`       | `square`     | `track`       | `box`        | `well`      | `knob`        |
| Milk Glass       | `glass`       | `round`      | `pill`        | `round`      | `pill`      | `knob`        |
| Aurora Night     | `glass`       | `round`      | `pill`        | `box`        | `pill`      | `round`       |
| Coral Space      | `soft`        | `round`      | `pill`        | `round`      | `underline` | `round`       |
| Dusk Haze        | `glass`       | `round`      | `track`       | `round`      | `pill`      | `knob`        |
| Soft Glass       | `glass`       | `round`      | `pill`        | `round`      | `well`      | `round`       |

Each is an ordinary preset definition. `resolveRegistry().presets` holds all of them as data, and three are quoted here because they show different techniques.

### Paper & Ink: signatures and ink shadows on Quiet

Its definition file in the kit's source holds exactly this object (the source imports the type from inside the kit).

```ts
// packages/ui/src/theme/styles/builtin/presets/paper-ink.ts
import type { PresetDefinition } from "darkraise-ui/theme-config"

export const paperInk: PresetDefinition = {
  label: "Paper & Ink",
  style: "quiet",
  shellStyle: "flat",
  axes: {
    accentColor: "blue",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "none",
    font: "geist",
    headingFont: "newsreader",
    darkAccentChroma: "calm",
  },
  signatures: {
    navSelection: "rule",
    railTone: "page",
    barTone: "page",
    tooltipTone: "inverse",
    cardFooter: "inset",
    bannerMark: "stripe",
    badgeStyle: "tint",
    fieldFill: "surface",
    tableHead: "ruled",
    dialogHeader: "plain",
    dialogFooter: "ruled",
    avatarShape: "round",
    switchStyle: "track",
    checkStyle: "outline",
    tabStyle: "underline",
    sliderStyle: "ruled",
  },
  tokens: {
    shared: {
      chromeFlatFill: "hsl(var(--background))",
      buttonEdge: "inset 0 1px 0 rgb(255 255 255 / 0.1)",
      buttonShadow: "0 1px 1px hsl(var(--foreground) / 0.2)",
      buttonDangerShadow: "0 1px 1px hsl(var(--foreground) / 0.2)",
      buttonNeutralShadow: "0 1px 0 hsl(var(--foreground) / 0.05)",
      thumbShadow: "0 1px 2px hsl(var(--foreground) / 0.25)",
      cardEdge: "0 1px 0 hsl(var(--foreground) / 0.04)",
      dropdownShadow:
        "0 2px 4px hsl(var(--foreground) / 0.05), 0 12px 28px -8px hsl(var(--foreground) / 0.18)",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 4px 8px hsl(var(--foreground) / 0.04), 0 32px 64px -16px hsl(var(--foreground) / 0.28)",
      bannerBorder: "transparent",
      badgeRadius: "calc(var(--radius-control) * 2)",
      menuItemRadius: "calc(var(--radius) - 2px)",
      pageTitleWeight: "500",
      pageTitleTracking: "-0.01em",
      sectionTitleWeight: "500",
      dialogTitleWeight: "500",
      figureWeight: "500",
    },
    dark: {
      buttonShadow: "0 1px 1px rgb(0 0 0 / 0.5)",
      buttonDangerShadow: "0 1px 1px rgb(0 0 0 / 0.5)",
      buttonNeutralShadow: "0 1px 0 rgb(0 0 0 / 0.125)",
      thumbShadow: "0 1px 2px rgb(0 0 0 / 0.5)",
      cardEdge: "0 1px 0 rgb(0 0 0 / 0.1)",
      dropdownShadow:
        "0 2px 4px rgb(0 0 0 / 0.125), 0 12px 28px -8px rgb(0 0 0 / 0.45)",
      modalShadow:
        "0 0 0 1px var(--quiet-ring), 0 4px 8px rgb(0 0 0 / 0.1), 0 32px 64px -16px rgb(0 0 0 / 0.6)",
    },
  },
}
```

- It writes the six brand axes (accent, neutral, tint, signal, body font, heading font) and one more, `darkAccentChroma`. Density, radius and font size stay with the app.
- Several signatures set a value back to the kit default (`railTone: "page"`, `dialogHeader: "plain"`, `avatarShape: "round"`, `bannerMark: "stripe"`) because Quiet sets another one. A preset must name the default to undo its style's choice.
- Quiet draws no shadow on buttons, thumbs and cards. The preset draws short ones in the text colour, `hsl(var(--foreground) / a)`, so they read as paper rather than grey, and overrides each one under `dark` with black, since dark mode has no paper to tint. Quiet has `dark` values of its own for `dropdownShadow` and `modalShadow`; the preset's `shared` values would replace those in dark mode too, which is why the same tokens appear under the preset's `dark` key.
- `modalShadow` reads `--quiet-ring`, a private variable of its style.
- It asks for the flat shell and sets `chromeFlatFill` to the page colour, so the rail and the bar are the page itself.
- Every radius is an expression of `--radius` or `--radius-control`. A capsule would use `var(--radius-pill)`, which squares under sharp with the other controls.

### Mica Desk: steering Glass through the axes

This is an excerpt: the axes, the signatures and the tokens that concern the shell and translucency.

```ts
// packages/ui/src/theme/styles/builtin/presets/mica-desk.ts
import type { PresetDefinition } from "darkraise-ui/theme-config"

export const micaDesk: PresetDefinition = {
  label: "Mica Desk",
  style: "glass",
  shellStyle: "inset",
  axes: {
    accentColor: "blue",
    surfaceColor: "zinc",
    tintWithAccent: "off",
    signalColor: "none",
    font: "inter",
    headingFont: "body",
    radius: "subtle",
    gradientPattern: "blobs",
    backgroundIntensity: "balanced",
  },
  signatures: {
    navSelection: "pill",
    barEdge: "none",
    menuHighlight: "neutral",
    cardDivider: "hairline",
    badgeStyle: "tint",
    fieldBorder: "bottom",
    dialogFooter: "band",
    buttonStyle: "solid",
    iconButton: "square",
    switchStyle: "track",
    checkStyle: "box",
    tabStyle: "underline",
  },
  tokens: {
    // The other tokens are left out of this excerpt.
    shared: {
      shellContentFill:
        "hsl(var(--card) / max(0.35, calc(var(--surface-alpha) * 2 - 1)))",
    },
    light: {
      surfaceFillAlpha: "0.6",
      shellGroundGradient:
        "radial-gradient(80% 70% at 10% 0%, hsl(var(--primary) / 0.34), transparent 60%)",
      shellContentEdge: "rgb(0 0 0 / 0.06)",
      cardEdge: "inset 0 1px 0 rgb(255 255 255 / 0.6)",
      dropdownShadow: "0 0 2px rgb(0 0 0 / 0.12), 0 8px 16px rgb(0 0 0 / 0.14)",
    },
    dark: {
      surfaceFillAlpha: "0.62",
      shellGroundGradient:
        "radial-gradient(80% 70% at 10% 0%, hsl(var(--primary) / 0.28), transparent 60%)",
      shellContentEdge: "rgb(0 0 0 / 0.1)",
      cardEdge: "inset 0 1px 0 rgb(255 255 255 / 0.08)",
      dropdownShadow: "0 0 2px rgb(0 0 0 / 0.24), 0 8px 16px rgb(0 0 0 / 0.28)",
    },
  },
}
```

- Glass sets no token in its `when` entries, so the preset declares the Medium opacity of its cards (`surfaceFillAlpha`) per mode itself, takes Glass's popups (`overlayFillAlpha`, 0.6), and steers the canvas with `gradientPattern` and `backgroundIntensity`. The user still moves Transparency, Blur and the canvas.
- `shellGroundGradient` replaces the shell's ground under the Gradient background, Glass's default. A value with no opaque layer, here a single accent bloom, lets the page canvas show through the shell. Under Solid the shell keeps its opaque ground: the page colour, recessed 5% toward the text colour under the inset and island shells.
- The content pane is a translucent slab: `shellContentFill` is the card colour at an alpha computed from `--surface-alpha`, twice its distance from opaque, floored at `0.35`. With the preset's `0.6` and `0.62` the expression gives `0.2` and `0.24` at Medium, so the floor holds the slab at `0.35` and keeps it from turning clear at High. Under more contrast the kit sets `--surface-fill-alpha` to `1`, `--surface-alpha` follows, and the same expression gives `1`, so the slab turns opaque together with the cards although the kit does not reset `shellContentFill`.
- `cardEdge` opens with the white top highlight every glass look carries; the preset sets it per mode because Glass does, and takes Glass's white rim (`cardBorder`).
- `dropdownShadow` is written under `light` and `dark`, because Glass sets it per mode.
- `buttonStyle: "solid"`, `iconButton: "square"` and `checkStyle: "box"` return to the kit defaults, because Glass picks `glass`, `round` and `round`. The preset keeps Glass's `knob` slider by not naming `sliderStyle`.

### Braun Panel: a signal colour, seams and per-mode keys on Tactile

This is an excerpt: the axes, the signatures and a few of its tokens.

```ts
// packages/ui/src/theme/styles/builtin/presets/braun-panel.ts
import type { PresetDefinition } from "darkraise-ui/theme-config"

export const braunPanel: PresetDefinition = {
  label: "Braun Panel",
  style: "tactile",
  shellStyle: "framed",
  axes: {
    accentColor: "neutral",
    surfaceColor: "sand",
    tintWithAccent: "off",
    signalColor: "yellow",
    font: "geist",
    headingFont: "body",
  },
  signatures: {
    barTone: "page",
    barSpan: "content",
    labelCase: "lower",
    tooltipTone: "inverse",
    cardDivider: "seam",
    tableHead: "seam",
    bannerMark: "lamp",
    bannerSurface: "card",
    badgeStyle: "outline",
    fieldFill: "well",
    dialogFooter: "plain",
    avatarShape: "round",
    switchStyle: "slide",
    tabStyle: "outline",
    sliderStyle: "bar",
  },
  tokens: {
    // The other tokens are left out of this excerpt.
    shared: {
      fieldFocusRing: "0 0 0 3px hsl(var(--signal-fill) / 0.55)",
      cardBorder: "hsl(var(--border))",
      cardRadius: "calc(var(--radius) * 1.75)",
    },
    light: {
      buttonEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.12), inset 0 0 0 1px rgb(0 0 0 / 0.3)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.9), 0 1px 2px hsl(var(--foreground) / 0.08), 0 6px 16px -6px hsl(var(--foreground) / 0.12)",
      seamHighlight: "rgb(255 255 255)",
    },
    dark: {
      buttonEdge:
        "inset 0 1px 0 rgb(255 255 255), inset 0 -2px 0 rgb(0 0 0 / 0.08), inset 0 0 0 1px rgb(0 0 0 / 0.3)",
      cardEdge:
        "inset 0 1px 0 rgb(255 255 255 / 0.05), 0 1px 2px rgb(0 0 0 / 0.4), 0 6px 16px -6px rgb(0 0 0 / 0.5)",
      cardSheen:
        "linear-gradient(180deg, rgb(255 255 255 / 0.015), rgb(0 0 0 / 0.08))",
      seam: "rgb(0 0 0 / 0.5)",
      seamHighlight: "rgb(255 255 255 / 0.05)",
    },
  },
}
```

- `signalColor: "yellow"` gives the preset a second hue beside its neutral accent. `bannerMark: "lamp"` lights info and neutral banners in it, and the focus ring reads `--signal-fill` directly. Because the preset sets a signal colour, the Signal Color control appears in the switcher.
- `bannerSurface: "card"` is paired with the lamp mark, which does not depend on the banner's border.
- It keeps Tactile's `key` buttons by not naming `buttonStyle`, and replaces Tactile's `knob` slider with `bar`.
- `cardDivider: "seam"` and `tableHead: "seam"` draw the `seam` line over the `seamHighlight` line. The preset sets them per mode: a white highlight under the default line in light mode, and a black line over a faint white highlight in dark mode.
- Tactile sets `buttonEdge` and `cardEdge` values of its own, and a `dark` value for `buttonEdge`. The preset writes each under `light` and `dark`, never under `shared`.
- The dark `cardSheen` opens with its white alpha, `0.015`, in the top-down form described under [What the vocabulary does not do](#what-the-vocabulary-does-not-do).

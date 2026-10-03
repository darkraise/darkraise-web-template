import type {
  AccentColor,
  Density,
  Font,
  GlowLevel,
  Mode,
  SidebarActiveBarSetting,
  ThemeContextValue,
  ThemeSettings,
} from "@theme/types"
import type { PresetName } from "@theme/presets"
import type { ThemeConfig } from "@theme/themeConfig"
import type { ThemeAxisName } from "@labels"
import type { AxisKey } from "./registry"

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false
type Expect<T extends true> = T

/** Compile-time only: `pnpm --filter darkraise-ui typecheck` fails if any entry is false. */
export type RegistryTypeChecks = [
  Expect<Equal<ThemeContextValue["density"], Density>>,
  Expect<Equal<ThemeContextValue["font"], Font>>,
  Expect<Equal<ThemeContextValue["setFont"], (value: Font) => void>>,
  Expect<Equal<ThemeContextValue["preset"], PresetName>>,
  Expect<Equal<ThemeContextValue["mode"], Mode>>,
  Expect<Equal<ThemeContextValue["outerGlow"], GlowLevel>>,
  Expect<Equal<ThemeContextValue["sidebarActiveBar"], SidebarActiveBarSetting>>,
  Expect<Equal<ThemeContextValue["setDensity"], (value: Density) => void>>,
  Expect<
    Equal<ThemeContextValue["setAccentColor"], (value: AccentColor) => void>
  >,
  Expect<Equal<ThemeSettings["accentColor"], AccentColor | undefined>>,
  Expect<Record<string, never> extends ThemeSettings ? true : false>,
  Expect<Equal<NonNullable<ThemeConfig["defaults"]["density"]>, Density>>,
  Expect<
    AxisKey extends keyof NonNullable<ThemeConfig["switcher"]["axes"]>
      ? true
      : false
  >,
  Expect<AxisKey extends ThemeAxisName ? true : false>,
]

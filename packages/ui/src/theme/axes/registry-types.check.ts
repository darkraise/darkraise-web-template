import type {
  AccentColor,
  Density,
  GlassBlur,
  GlassOpacity,
  GlowLevel,
  Mode,
  SidebarSelectionSetting,
  ThemeContextValue,
  ThemeSettings,
} from "@theme/types"
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
  Expect<Equal<ThemeContextValue["font"], string>>,
  Expect<Equal<ThemeContextValue["setFont"], (value: string) => void>>,
  Expect<Equal<ThemeContextValue["headingFont"], string>>,
  Expect<Equal<ThemeContextValue["setHeadingFont"], (value: string) => void>>,
  Expect<Equal<ThemeContextValue["style"], string>>,
  Expect<Equal<ThemeContextValue["setStyle"], (value: string) => void>>,
  Expect<Equal<ThemeContextValue["preset"], string>>,
  Expect<Equal<ThemeContextValue["setPreset"], (value: string) => void>>,
  Expect<Equal<ThemeContextValue["glassOpacity"], GlassOpacity>>,
  Expect<Equal<ThemeContextValue["glassBlur"], GlassBlur>>,
  Expect<"activePreset" extends keyof ThemeContextValue ? false : true>,
  Expect<"presetAxisValues" extends keyof ThemeContextValue ? false : true>,
  Expect<"setPresetAxis" extends keyof ThemeContextValue ? false : true>,
  Expect<"presetAxisValues" extends keyof ThemeSettings ? false : true>,
  Expect<Equal<ThemeContextValue["mode"], Mode>>,
  Expect<Equal<ThemeContextValue["outerGlow"], GlowLevel>>,
  Expect<Equal<ThemeContextValue["sidebarSelection"], SidebarSelectionSetting>>,
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
  Expect<Equal<ThemeAxisName, AxisKey>>,
]

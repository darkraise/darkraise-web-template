import type { ReactNode } from "react"
import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ThemeProvider, themeConfig } from "@theme"
import type { AxisValues } from "@theme"
import { useSidebarSelection, useSidebarShadow } from "./useSidebarSelection"

const withDefaults =
  (defaults: Partial<AxisValues>) =>
  ({ children }: { children: ReactNode }) => (
    <ThemeProvider
      config={{
        ...themeConfig,
        styles: {
          pale: { label: "Pale", extends: "glass" },
          plain: { label: "Plain", extends: "flat" },
        },
        defaults: { ...themeConfig.defaults, ...defaults },
      }}
    >
      {children}
    </ThemeProvider>
  )

describe("useSidebarSelection", () => {
  it("resolves the registry defaults without a provider", () => {
    expect(renderHook(() => useSidebarSelection()).result.current).toBe("chip")
  })

  it("follows the style under auto", () => {
    const { result } = renderHook(() => useSidebarSelection(), {
      wrapper: withDefaults({ style: "glass" }),
    })
    expect(result.current).toBe("frosted")
  })

  it("follows a consumer style's nearest built-in ancestor under auto", () => {
    const { result } = renderHook(() => useSidebarSelection(), {
      wrapper: withDefaults({ style: "pale" }),
    })
    expect(result.current).toBe("frosted")
  })

  it("uses an explicit setting under any style", () => {
    const { result } = renderHook(() => useSidebarSelection(), {
      wrapper: withDefaults({ style: "glass", sidebarSelection: "pill" }),
    })
    expect(result.current).toBe("pill")
  })

  it("lets the caller's override win", () => {
    const { result } = renderHook(() => useSidebarSelection("tile"), {
      wrapper: withDefaults({ sidebarSelection: "pill" }),
    })
    expect(result.current).toBe("tile")
  })
})

describe("useSidebarShadow", () => {
  it("drops the shadows under Flat, whatever the look", () => {
    const { result } = renderHook(() => useSidebarShadow(), {
      wrapper: withDefaults({ style: "flat", sidebarSelection: "tile" }),
    })
    expect(result.current).toBe("none")
  })

  it("drops the shadows under a style that extends Flat", () => {
    const { result } = renderHook(() => useSidebarShadow(), {
      wrapper: withDefaults({ style: "plain" }),
    })
    expect(result.current).toBe("none")
  })

  it("keeps them under another style and without a provider", () => {
    expect(renderHook(() => useSidebarShadow()).result.current).toBeUndefined()
    const { result } = renderHook(() => useSidebarShadow(), {
      wrapper: withDefaults({ style: "tactile" }),
    })
    expect(result.current).toBeUndefined()
  })
})

import type { ReactNode } from "react"
import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ThemeProvider, themeConfig } from "@theme"
import type { AxisValues } from "@theme"
import { useSidebarSelection } from "./useSidebarSelection"

const withDefaults =
  (defaults: Partial<AxisValues>) =>
  ({ children }: { children: ReactNode }) => (
    <ThemeProvider
      config={{
        ...themeConfig,
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

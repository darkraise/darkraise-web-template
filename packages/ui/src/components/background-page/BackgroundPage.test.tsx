import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import { BackgroundPage } from "./BackgroundPage"
import { BACKGROUND_PAGE_VARIANTS } from "./variants"

function stubMatchMedia(reduced = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeAll(() => {
  // jsdom implements neither the 2D canvas context nor rAF reliably; stub the
  // minimal surface BackgroundCanvas touches so the canvas variants mount
  // without pulling in a native build dependency or running the paint loop.
  const ctx: Partial<CanvasRenderingContext2D> = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
  }
  ;(
    HTMLCanvasElement.prototype as unknown as {
      getContext: () => CanvasRenderingContext2D | null
    }
  ).getContext = vi.fn(() => ctx as CanvasRenderingContext2D)
  vi.stubGlobal("requestAnimationFrame", () => 0)
  vi.stubGlobal("cancelAnimationFrame", () => undefined)
})

beforeEach(() => {
  stubMatchMedia(false)
})

afterEach(() => {
  cleanup()
})

describe("BackgroundPage", () => {
  it("renders the aurora variant by default", () => {
    const { container } = render(<BackgroundPage data-testid="bg" />)
    const root = screen.getByTestId("bg")
    expect(root).toHaveClass("dr-background-page")
    expect(root).toHaveAttribute("data-variant", "aurora")
    expect(root).toHaveAttribute("data-interactive", "true")
    expect(root).toHaveAttribute("data-motion", "full")
    expect(container.querySelectorAll(".dr-bg-aurora-band")).toHaveLength(3)
  })

  it("reflects the requested variant on data-variant", () => {
    const { container } = render(
      <BackgroundPage data-testid="bg" variant="spotlight" />,
    )
    expect(screen.getByTestId("bg")).toHaveAttribute(
      "data-variant",
      "spotlight",
    )
    expect(container.querySelector(".dr-bg-spotlight-glow")).not.toBeNull()
  })

  it("renders children inside the content layer", () => {
    render(
      <BackgroundPage>
        <button type="button">Sign in</button>
      </BackgroundPage>,
    )
    const button = screen.getByRole("button", { name: "Sign in" })
    expect(button.closest(".dr-background-page-content")).not.toBeNull()
  })

  it("omits the content layer when there are no children", () => {
    const { container } = render(<BackgroundPage />)
    expect(container.querySelector(".dr-background-page-content")).toBeNull()
  })

  it("marks the decorative layer aria-hidden", () => {
    const { container } = render(<BackgroundPage>content</BackgroundPage>)
    const layer = container.querySelector(".dr-background-page-layer")
    expect(layer).toHaveAttribute("aria-hidden", "true")
  })

  it("mounts a canvas for canvas-backed variants", () => {
    const { container } = render(<BackgroundPage variant="constellation" />)
    const canvas = container.querySelector("canvas.dr-bg-canvas")
    expect(canvas).not.toBeNull()
    expect(canvas).toHaveAttribute("aria-hidden", "true")
  })

  it("reports data-motion=reduced when the user prefers reduced motion", () => {
    stubMatchMedia(true)
    render(<BackgroundPage data-testid="bg" variant="starfield" />)
    expect(screen.getByTestId("bg")).toHaveAttribute("data-motion", "reduced")
  })

  it("reflects interactive=false on data-interactive", () => {
    render(<BackgroundPage data-testid="bg" interactive={false} />)
    expect(screen.getByTestId("bg")).toHaveAttribute(
      "data-interactive",
      "false",
    )
  })

  it("forwards a ref to the root element", () => {
    let node: HTMLDivElement | null = null
    render(
      <BackgroundPage
        ref={(el) => {
          node = el
        }}
      />,
    )
    expect(node).toBeInstanceOf(HTMLDivElement)
    expect(node).toHaveClass("dr-background-page")
  })

  it("mounts and unmounts a canvas variant without throwing", () => {
    const { unmount } = render(<BackgroundPage variant="waves" />)
    expect(() => unmount()).not.toThrow()
  })

  it.each(["ripple", "dotgrid", "flowfield", "contour"] as const)(
    "mounts the %s canvas variant without throwing",
    (variant) => {
      const { container, unmount } = render(
        <BackgroundPage variant={variant} />,
      )
      expect(container.querySelector("canvas.dr-bg-canvas")).not.toBeNull()
      expect(() => unmount()).not.toThrow()
    },
  )

  it("mounts a reduced-motion canvas variant without throwing", () => {
    stubMatchMedia(true)
    const { unmount } = render(<BackgroundPage variant="constellation" />)
    expect(() => unmount()).not.toThrow()
  })

  it("exposes speed and intensity factors as CSS variables on the root", () => {
    render(
      <BackgroundPage
        data-testid="bg"
        variant="aurora"
        speed={2}
        intensity={0.5}
      />,
    )
    const root = screen.getByTestId("bg")
    expect(root.style.getPropertyValue("--dr-bg-speed")).toBe("2")
    expect(root.style.getPropertyValue("--dr-bg-intensity")).toBe("0.5")
  })

  it("clamps out-of-range factor props", () => {
    render(
      <BackgroundPage
        data-testid="bg"
        variant="aurora"
        speed={99}
        intensity={-5}
      />,
    )
    const root = screen.getByTestId("bg")
    expect(root.style.getPropertyValue("--dr-bg-speed")).toBe("4")
    expect(root.style.getPropertyValue("--dr-bg-intensity")).toBe("0")
  })

  it("defaults factor variables to 1", () => {
    render(<BackgroundPage data-testid="bg" variant="aurora" />)
    const root = screen.getByTestId("bg")
    expect(root.style.getPropertyValue("--dr-bg-speed")).toBe("1")
    expect(root.style.getPropertyValue("--dr-bg-intensity")).toBe("1")
  })

  it("exposes metadata for all twelve variants", () => {
    expect(BACKGROUND_PAGE_VARIANTS).toHaveLength(12)
    const canvasCount = BACKGROUND_PAGE_VARIANTS.filter((v) => v.canvas).length
    expect(canvasCount).toBe(7)
  })
})

import { useRef } from "react"
import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useNavIndicator } from "./useNavIndicator"

const BOXES: Record<string, [number, number, number, number]> = {
  nav: [10, 100, 200, 300],
  a: [18, 110, 184, 36],
  b: [18, 150, 184, 36],
  c: [18, 190, 184, 36],
}

function Harness({
  path,
  showC = false,
  mounted = true,
  items,
}: {
  path: string
  showC?: boolean
  mounted?: boolean
  items?: unknown
}) {
  const nav = useRef<HTMLElement>(null)
  const indicator = useRef<HTMLSpanElement>(null)
  useNavIndicator(nav, indicator, path, items)
  if (!mounted) return null
  return (
    <nav ref={nav} data-testid="nav" data-indicator="pending">
      <span ref={indicator} data-testid="indicator" />
      <a
        data-testid="a"
        className={path === "/a" ? "dr-sidebar-nav-current" : ""}
      >
        A
      </a>
      <a
        data-testid="b"
        className={path === "/b" ? "dr-sidebar-nav-current" : ""}
      >
        B
      </a>
      {showC && (
        <a
          data-testid="c"
          className={path === "/c" ? "dr-sidebar-nav-current" : ""}
        >
          C
        </a>
      )}
    </nav>
  )
}

let resize: (() => void) | undefined
let observed: Element[] = []
let boxes: Record<string, [number, number, number, number]> = {}

beforeEach(() => {
  boxes = { ...BOXES }
  observed = []
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function (this: HTMLElement) {
      const [left, top, width, height] = boxes[this.dataset.testid ?? ""] ?? [
        0, 0, 0, 0,
      ]
      return {
        left,
        top,
        width,
        height,
        x: left,
        y: top,
        right: left + width,
        bottom: top + height,
        toJSON: () => ({}),
      } as DOMRect
    },
  )
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe(target: Element) {
        observed.push(target)
      }
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resize = undefined
})

describe("useNavIndicator", () => {
  it("places the indicator on the current row without animating", () => {
    render(<Harness path="/a" />)
    const indicator = screen.getByTestId("indicator")
    expect(indicator.style.transform).toBe("translate(8px, 10px)")
    expect(indicator.style.width).toBe("184px")
    expect(indicator.style.height).toBe("36px")
    expect(indicator.dataset.animate).toBe("false")
    expect(screen.getByTestId("nav").dataset.indicator).toBe("ready")
  })

  it("slides when the key changes", () => {
    const { rerender } = render(<Harness path="/a" />)
    rerender(<Harness path="/b" />)
    const indicator = screen.getByTestId("indicator")
    expect(indicator.style.transform).toBe("translate(8px, 50px)")
    expect(indicator.dataset.animate).toBe("true")
  })

  it("watches the nav for size changes", () => {
    render(<Harness path="/a" />)
    expect(observed).toContain(screen.getByTestId("nav"))
  })

  it("keeps the slide when the observer reports an unchanged size", () => {
    const { rerender } = render(<Harness path="/a" />)
    rerender(<Harness path="/b" />)
    resize?.() // an observer's first call reports the size it started with
    const indicator = screen.getByTestId("indicator")
    expect(indicator.dataset.animate).toBe("true")
    expect(indicator.style.transform).toBe("translate(8px, 50px)")
  })

  it("re-places at once when the nav resizes", () => {
    const { rerender } = render(<Harness path="/a" />)
    rerender(<Harness path="/b" />)
    // A group above opens: the nav grows and row b moves down and narrows.
    boxes.nav = [10, 100, 200, 380]
    boxes.b = [18, 230, 180, 40]
    resize?.()
    const indicator = screen.getByTestId("indicator")
    expect(indicator.style.transform).toBe("translate(8px, 130px)")
    expect(indicator.style.width).toBe("180px")
    expect(indicator.style.height).toBe("40px")
    expect(indicator.style.getPropertyValue("--indicator-x")).toBe("8px")
    expect(indicator.dataset.animate).toBe("false")
  })

  it("finds a row that appears with the first resize after navigating", () => {
    // Navigating into a closed group: the row is missing until the group
    // opens, and the opening is the observer's first report.
    const { rerender } = render(<Harness path="/a" />)
    rerender(<Harness path="/c" />)
    expect(screen.getByTestId("nav").dataset.indicator).toBe("none")
    rerender(<Harness path="/c" showC />)
    boxes.nav = [10, 100, 200, 340]
    resize?.()
    expect(screen.getByTestId("nav").dataset.indicator).toBe("ready")
    expect(screen.getByTestId("indicator").style.transform).toBe(
      "translate(8px, 90px)",
    )
  })

  it("reports no current row", () => {
    render(<Harness path="/elsewhere" />)
    expect(screen.getByTestId("nav").dataset.indicator).toBe("none")
  })

  it("places a remounted nav without sliding", () => {
    // The stacked layout's aside unmounts on a route outside every group
    // and mounts a fresh indicator when the route comes back into one.
    const { rerender } = render(<Harness path="/a" />)
    rerender(<Harness path="/x" mounted={false} />)
    rerender(<Harness path="/b" />)
    const indicator = screen.getByTestId("indicator")
    expect(indicator.style.transform).toBe("translate(8px, 50px)")
    expect(indicator.dataset.animate).toBe("false")
  })

  it("re-places at once when the items change under the same path", () => {
    const first = [{}]
    const { rerender } = render(<Harness path="/b" items={first} />)
    // The rows swap places: same pathname, same nav size.
    boxes.a = [18, 150, 184, 36]
    boxes.b = [18, 110, 184, 36]
    rerender(<Harness path="/b" items={[{}]} />)
    const indicator = screen.getByTestId("indicator")
    expect(indicator.style.transform).toBe("translate(8px, 10px)")
    expect(indicator.dataset.animate).toBe("false")
  })

  it("keeps a running slide when a re-render moves nothing", () => {
    const { rerender } = render(<Harness path="/a" items={[{}]} />)
    rerender(<Harness path="/b" items={[{}]} />)
    rerender(<Harness path="/b" items={[{}]} />)
    const indicator = screen.getByTestId("indicator")
    expect(indicator.dataset.animate).toBe("true")
    expect(indicator.style.transform).toBe("translate(8px, 50px)")
  })

  it("keeps a running slide when the row moves under half a pixel", () => {
    const { rerender } = render(<Harness path="/a" items={[{}]} />)
    rerender(<Harness path="/b" items={[{}]} />)
    boxes.b = [18.3, 150.25, 184.4, 36.2]
    rerender(<Harness path="/b" items={[{}]} />)
    const indicator = screen.getByTestId("indicator")
    expect(indicator.dataset.animate).toBe("true")
    expect(indicator.style.transform).toBe("translate(8px, 50px)")
  })
})

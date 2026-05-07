import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { createRef } from "react"
import { AspectRatio } from "@components/aspect-ratio"

describe("AspectRatio", () => {
  it("renders with default ratio of 1 (square)", () => {
    const { container } = render(
      <AspectRatio>
        <div>content</div>
      </AspectRatio>,
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveAttribute("data-aspect-ratio-wrapper", "")
    expect(wrapper.style.paddingBottom).toBe("100%")
    expect(wrapper.style.position).toBe("relative")
  })

  it("computes padding for 16:9 ratio", () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9}>
        <div>content</div>
      </AspectRatio>,
    )
    const wrapper = container.firstChild as HTMLElement
    const padding = parseFloat(wrapper.style.paddingBottom)
    expect(padding).toBeCloseTo(56.25, 1)
  })

  it("forwards ref to the inner content element", () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <AspectRatio ref={ref}>
        <div>x</div>
      </AspectRatio>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current?.style.position).toBe("absolute")
  })

  it("applies custom className to the inner element", () => {
    const { container } = render(
      <AspectRatio className="my-aspect">
        <div>x</div>
      </AspectRatio>,
    )
    const inner = container.querySelector(".my-aspect") as HTMLElement
    expect(inner).not.toBeNull()
    expect(inner.classList.contains("dr-aspect-ratio")).toBe(true)
  })

  it("renders children", () => {
    const child = document.createElement("img")
    child.alt = "test"
    const { getByAltText } = render(
      <AspectRatio>
        <img alt="test" />
      </AspectRatio>,
    )
    expect(getByAltText("test")).toBeInTheDocument()
    void child
  })

  it("merges user style with positioning style", () => {
    const { container } = render(
      <AspectRatio style={{ background: "red" }}>
        <div>x</div>
      </AspectRatio>,
    )
    const inner = container.querySelector(".dr-aspect-ratio") as HTMLElement
    expect(inner.style.background).toBe("red")
    expect(inner.style.position).toBe("absolute")
  })
})

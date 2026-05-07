import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { createRef } from "react"
import { Progress } from "@components/progress"

describe("Progress", () => {
  it("renders progressbar role with default max 100", () => {
    const { container } = render(<Progress value={50} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute("role", "progressbar")
    expect(root).toHaveAttribute("aria-valuemax", "100")
    expect(root).toHaveAttribute("aria-valuemin", "0")
    expect(root).toHaveAttribute("aria-valuenow", "50")
  })

  it("emits aria-valuetext via default formatter", () => {
    const { container } = render(<Progress value={42} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute("aria-valuetext", "42%")
  })

  it("uses provided max", () => {
    const { container } = render(<Progress value={2} max={4} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute("aria-valuemax", "4")
    expect(root).toHaveAttribute("aria-valuenow", "2")
  })

  it("supports indeterminate (null value)", () => {
    const { container } = render(<Progress value={null} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute("data-state", "indeterminate")
    expect(root).not.toHaveAttribute("aria-valuenow")
  })

  it("emits data-state complete when value equals max", () => {
    const { container } = render(<Progress value={100} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute("data-state", "complete")
  })

  it("emits data-state loading otherwise", () => {
    const { container } = render(<Progress value={30} />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute("data-state", "loading")
  })

  it("indicator translates by percent", () => {
    const { container } = render(<Progress value={25} />)
    const indicator = container.querySelector(
      ".dr-progress-indicator",
    ) as HTMLElement
    expect(indicator.style.transform).toBe("translateX(-75%)")
  })

  it("forwards ref", () => {
    const ref = createRef<HTMLDivElement>()
    render(<Progress ref={ref} value={10} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("custom getValueLabel", () => {
    const { container } = render(
      <Progress value={3} max={10} getValueLabel={(v, m) => `${v} of ${m}`} />,
    )
    expect(container.firstChild).toHaveAttribute("aria-valuetext", "3 of 10")
  })
})

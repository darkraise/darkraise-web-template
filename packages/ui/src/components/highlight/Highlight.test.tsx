import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Highlight } from "./Highlight"

describe("Highlight", () => {
  it("wraps every occurrence of a single string query", () => {
    const { container } = render(
      <Highlight text="foo and foo and foo" query="foo" />,
    )
    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(3)
    marks.forEach((mark) => {
      expect(mark.textContent).toBe("foo")
      expect(mark).toHaveAttribute("data-match", "true")
      expect(mark.className).toContain("dr-highlight-match")
    })
  })

  it("wraps occurrences of every term in an array query", () => {
    const { container } = render(
      <Highlight text="The foo went to the bar" query={["foo", "bar"]} />,
    )
    const marks = Array.from(container.querySelectorAll("mark"))
    expect(marks).toHaveLength(2)
    expect(marks.map((m) => m.textContent)).toEqual(["foo", "bar"])
  })

  it("respects ignoreCase=false", () => {
    const { container } = render(
      <Highlight text="Foo and foo and FOO" query="foo" ignoreCase={false} />,
    )
    const marks = Array.from(container.querySelectorAll("mark"))
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe("foo")
  })

  it("only marks the first hit when matchAll=false", () => {
    const { container } = render(
      <Highlight text="foo and foo and foo" query="foo" matchAll={false} />,
    )
    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe("foo")
  })

  it("renders text untouched for an empty string query", () => {
    const { container } = render(
      <Highlight text="The foo went to the bar" query="" />,
    )
    expect(container.querySelectorAll("mark")).toHaveLength(0)
    expect(container.textContent).toBe("The foo went to the bar")
  })

  it("renders text untouched for an empty array query", () => {
    const { container } = render(
      <Highlight text="The foo went to the bar" query={[]} />,
    )
    expect(container.querySelectorAll("mark")).toHaveLength(0)
    expect(container.textContent).toBe("The foo went to the bar")
  })

  it("renders text untouched when array contains only empty strings", () => {
    const { container } = render(
      <Highlight text="The foo went to the bar" query={["", ""]} />,
    )
    expect(container.querySelectorAll("mark")).toHaveLength(0)
    expect(container.textContent).toBe("The foo went to the bar")
  })

  it("escapes regex metacharacters in the query", () => {
    const { container } = render(
      <Highlight text="price is $5.00 (USD)" query="$5.00" />,
    )
    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe("$5.00")
  })

  it("uses renderMatch override when provided", () => {
    render(
      <Highlight
        text="foo bar foo"
        query="foo"
        renderMatch={(part, i) => (
          <span key={i} data-testid="custom-match">
            {part}
          </span>
        )}
      />,
    )
    const customMarks = screen.getAllByTestId("custom-match")
    expect(customMarks).toHaveLength(2)
    expect(customMarks.every((el) => el.textContent === "foo")).toBe(true)
  })
})

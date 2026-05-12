import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import {
  FloatingPanel,
  FloatingPanelHeader,
  FloatingPanelContent,
  FloatingPanelTitle,
} from "./FloatingPanel"
import { FloatingPanelProvider } from "./FloatingPanelProvider"
import { FloatingPanelHost } from "./FloatingPanelHost"

function Inspector(props: { label: string }) {
  return (
    <>
      <FloatingPanelHeader>
        <FloatingPanelTitle>{props.label}</FloatingPanelTitle>
      </FloatingPanelHeader>
      <FloatingPanelContent>
        <div data-testid="content">content for {props.label}</div>
      </FloatingPanelContent>
    </>
  )
}

describe("FloatingPanelHost", () => {
  it("renders one wrapping panel per open registered entry, with the registered component as content", () => {
    const { getByTestId } = render(
      <FloatingPanelProvider>
        <FloatingPanel
          scope="app"
          id="inspector-1"
          component={Inspector}
          componentProps={{ label: "First" }}
        />
        <FloatingPanelHost />
      </FloatingPanelProvider>,
    )
    expect(getByTestId("content").textContent).toBe("content for First")
  })

  it("does not render closed entries", () => {
    const { queryByTestId } = render(
      <FloatingPanelProvider>
        <FloatingPanel
          scope="app"
          id="x"
          component={Inspector}
          componentProps={{ label: "X" }}
          defaultOpen={false}
        />
        <FloatingPanelHost />
      </FloatingPanelProvider>,
    )
    expect(queryByTestId("content")).toBeNull()
  })
})

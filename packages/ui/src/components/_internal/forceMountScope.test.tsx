import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { createForceMountScope } from "./forceMountScope"

const first = createForceMountScope()
const second = createForceMountScope()

function Probe({
  name,
  own,
  scope,
}: {
  name: string
  own?: boolean
  scope: ReturnType<typeof createForceMountScope>
}) {
  const resolved = scope.useResolvedForceMount(own)
  const insidePortal = scope.useInsidePortal()
  return (
    <span data-testid={name} data-inside-portal={String(insidePortal)}>
      {String(resolved)}
    </span>
  )
}

describe("createForceMountScope", () => {
  it("resolves the content's own value before the provider's", () => {
    render(
      <first.ForceMountProvider forceMount>
        <Probe name="inherited" scope={first} />
        <Probe name="own" own={false} scope={first} />
      </first.ForceMountProvider>,
    )
    expect(screen.getByTestId("inherited")).toHaveTextContent("true")
    expect(screen.getByTestId("own")).toHaveTextContent("false")
  })

  it("is undefined without a provider", () => {
    render(<Probe name="bare" scope={first} />)
    expect(screen.getByTestId("bare")).toHaveTextContent("undefined")
  })

  it("does not reach another scope's content", () => {
    render(
      <first.ForceMountProvider forceMount>
        <Probe name="other" scope={second} />
      </first.ForceMountProvider>,
    )
    expect(screen.getByTestId("other")).toHaveTextContent("undefined")
  })

  it("lets a nested provider reset the value", () => {
    render(
      <first.ForceMountProvider forceMount>
        <first.ForceMountProvider>
          <Probe name="reset" scope={first} />
        </first.ForceMountProvider>
      </first.ForceMountProvider>,
    )
    expect(screen.getByTestId("reset")).toHaveTextContent("undefined")
  })

  it("reports a portal below a portal provider until a root provider resets it", () => {
    render(
      <>
        <Probe name="bare" scope={first} />
        <first.ForceMountProvider portal>
          <Probe name="portalled" scope={first} />
          <Probe name="other" scope={second} />
          <first.ForceMountProvider>
            <Probe name="reset" scope={first} />
          </first.ForceMountProvider>
        </first.ForceMountProvider>
      </>,
    )
    const inside = (name: string) =>
      screen.getByTestId(name).getAttribute("data-inside-portal")
    expect(inside("bare")).toBe("false")
    expect(inside("portalled")).toBe("true")
    expect(inside("other")).toBe("false")
    expect(inside("reset")).toBe("false")
  })
})

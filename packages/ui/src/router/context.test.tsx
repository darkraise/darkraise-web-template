import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import type { RouterAdapter } from "./types"
import { RouterAdapterProvider, useRouterAdapter } from "./context"

function Probe() {
  const adapter = useRouterAdapter()
  return <span data-testid="pathname">{adapter.usePathname()}</span>
}

const noopAdapter: RouterAdapter = {
  Link: ({ children }) => <>{children}</>,
  useNavigate: () => () => {},
  usePathname: () => "/probe",
  useBack: () => () => {},
  useInvalidate: () => () => {},
}

describe("useRouterAdapter", () => {
  it("throws a descriptive error when no provider is mounted", () => {
    expect(() => render(<Probe />)).toThrow(
      /useRouterAdapter must be used inside a <RouterAdapterProvider>/,
    )
  })

  it("returns the adapter supplied by the nearest provider", () => {
    render(
      <RouterAdapterProvider value={noopAdapter}>
        <Probe />
      </RouterAdapterProvider>,
    )
    expect(screen.getByTestId("pathname")).toHaveTextContent("/probe")
  })
})

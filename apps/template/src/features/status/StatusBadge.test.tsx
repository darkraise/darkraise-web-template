import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StatusBadge, statusVariant, type DemoStatus } from "./StatusBadge"

const STATUSES: DemoStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "active",
  "draft",
  "archived",
  "inactive",
]

const TINTS = [
  "success-subtle",
  "info-subtle",
  "warning-subtle",
  "destructive-subtle",
  "secondary",
  "outline",
]

describe("StatusBadge", () => {
  it("maps every demo status to a tint or a neutral, never a solid fill", () => {
    expect(Object.keys(statusVariant).sort()).toEqual([...STATUSES].sort())
    for (const status of STATUSES) {
      expect(TINTS, status).toContain(statusVariant[status])
    }
  })

  it("reads order statuses as a progression", () => {
    expect(statusVariant.pending).toBe("secondary")
    expect(statusVariant.processing).toBe("warning-subtle")
    expect(statusVariant.shipped).toBe("info-subtle")
    expect(statusVariant.delivered).toBe("success-subtle")
    expect(statusVariant.cancelled).toBe("destructive-subtle")
  })

  it("marks the badge with its status and variant", () => {
    const { container } = render(<StatusBadge status="shipped" />)
    const badge = container.querySelector('[data-status="shipped"]')
    expect(badge).toHaveAttribute("data-variant", "info-subtle")
    expect(badge).toHaveTextContent("shipped")
  })
})

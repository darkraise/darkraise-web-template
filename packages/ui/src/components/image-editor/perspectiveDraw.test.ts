import { describe, expect, it } from "vitest"
import { computeAffine } from "./perspectiveDraw"

describe("computeAffine", () => {
  it("returns the identity matrix when source equals destination", () => {
    const aff = computeAffine(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    )
    expect(aff).not.toBeNull()
    if (!aff) return
    const [a, b, c, d, e, f] = aff
    expect(a).toBeCloseTo(1, 5)
    expect(b).toBeCloseTo(0, 5)
    expect(c).toBeCloseTo(0, 5)
    expect(d).toBeCloseTo(1, 5)
    expect(e).toBeCloseTo(0, 5)
    expect(f).toBeCloseTo(0, 5)
  })

  it("returns a translation when source is offset to destination by a vector", () => {
    const aff = computeAffine(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: 5, y: 7 },
      { x: 15, y: 7 },
      { x: 5, y: 17 },
    )
    expect(aff).not.toBeNull()
    if (!aff) return
    const [a, b, c, d, e, f] = aff
    expect(a).toBeCloseTo(1, 5)
    expect(d).toBeCloseTo(1, 5)
    expect(b).toBeCloseTo(0, 5)
    expect(c).toBeCloseTo(0, 5)
    expect(e).toBeCloseTo(5, 5)
    expect(f).toBeCloseTo(7, 5)
  })

  it("returns a scale when destination doubles each axis", () => {
    const aff = computeAffine(
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 0, y: 20 },
    )
    expect(aff).not.toBeNull()
    if (!aff) return
    expect(aff[0]).toBeCloseTo(2, 5)
    expect(aff[3]).toBeCloseTo(2, 5)
  })

  it("returns null for a degenerate (collinear) source triangle", () => {
    const aff = computeAffine(
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 10 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    )
    expect(aff).toBeNull()
  })

  it("maps each source vertex to its destination", () => {
    const s0 = { x: 0, y: 0 }
    const s1 = { x: 100, y: 0 }
    const s2 = { x: 50, y: 80 }
    const d0 = { x: 10, y: 20 }
    const d1 = { x: 200, y: 30 }
    const d2 = { x: 80, y: 180 }
    const aff = computeAffine(s0, s1, s2, d0, d1, d2)
    expect(aff).not.toBeNull()
    if (!aff) return
    const apply = (p: { x: number; y: number }) => ({
      x: aff[0] * p.x + aff[2] * p.y + aff[4],
      y: aff[1] * p.x + aff[3] * p.y + aff[5],
    })
    const m0 = apply(s0)
    const m1 = apply(s1)
    const m2 = apply(s2)
    expect(m0.x).toBeCloseTo(d0.x, 5)
    expect(m0.y).toBeCloseTo(d0.y, 5)
    expect(m1.x).toBeCloseTo(d1.x, 5)
    expect(m1.y).toBeCloseTo(d1.y, 5)
    expect(m2.x).toBeCloseTo(d2.x, 5)
    expect(m2.y).toBeCloseTo(d2.y, 5)
  })
})

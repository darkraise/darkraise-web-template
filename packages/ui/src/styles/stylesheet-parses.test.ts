import { describe, it, expect } from "vitest"
import { transform } from "lightningcss"
import { buildStylesheet } from "../../scripts/build-css"

describe("published stylesheet", () => {
  it("parses as CSS", () => {
    const css = Buffer.from(buildStylesheet())

    // Consumers run this through Tailwind v4, which parses with lightningcss;
    // a stray comment fragment or unbalanced block breaks their build, not ours.
    expect(() =>
      transform({ filename: "styles.css", code: css, errorRecovery: false }),
    ).not.toThrow()
  })
})

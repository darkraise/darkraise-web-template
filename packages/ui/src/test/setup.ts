import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// jsdom implements no `matchMedia`, so any component reading a media query
// throws "matchMedia is not a function" on render. The default here reports
// "does not match", which is the right baseline for the queries the kit asks
// about: no reduced-motion preference, no wide viewport.
//
// Tests that care about a specific query redefine `window.matchMedia`
// themselves; `useMediaQuery` keys its cache by query string, so a suite
// stubbing one query does not disturb another.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

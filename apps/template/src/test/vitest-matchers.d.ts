/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type --
   This file mirrors jest-dom's own augmentation signature exactly; changing
   the shape would stop it merging with the matchers it is declaring. */

// jest-dom ships this exact augmentation in its own `types/vitest.d.ts`, but
// the `declare module 'vitest'` there resolves "vitest" relative to jest-dom's
// location in node_modules. Under pnpm the workspace holds several physical
// copies of vitest — packages/ui and this app pull different ones, and peer
// variants split them further — so the augmentation can attach to a copy this
// app never imports. Which copy wins depends on what the installer hoists to
// the workspace root, and that differs between machines: every
// `toBeInTheDocument` type-checked locally and none of them did on CI.
//
// Declaring it here fixes the target: "vitest" resolves from this app, so the
// matchers land on the same module its tests import.

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers"

declare module "vitest" {
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<
    any,
    any
  > {}
}

declare const __KIT_VERSION__: string

/**
 * Keys the pre-render token cache, so a kit upgrade never paints stale tokens.
 * tsup and vitest define it from package.json, which the release job stamps;
 * a bundler that does not (Storybook) falls back to a constant.
 */
export const KIT_VERSION: string =
  typeof __KIT_VERSION__ === "string" ? __KIT_VERSION__ : "dev"

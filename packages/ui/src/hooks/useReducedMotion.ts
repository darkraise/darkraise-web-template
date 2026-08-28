import { useMediaQuery } from "./useMediaQuery"

/**
 * Whether the user has asked for reduced motion.
 *
 * The kit neutralises CSS animations and transitions globally in `theme.css`.
 * This hook covers the motion CSS cannot reach: `scrollIntoView` takes its
 * behaviour from the call option rather than the `scroll-behavior` property,
 * and timer-driven motion like Carousel autoplay is not styling at all.
 *
 * Returns `false` until the media query resolves, so the first paint on the
 * server and during hydration matches the animated default rather than
 * flickering out of it.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)") === true
}

/**
 * The twelve predefined full-page background styles. Five are CSS-driven
 * (aurora, mesh, grid, orbs, spotlight) and seven paint to a <canvas> via
 * requestAnimationFrame (constellation, waves, starfield, ripple, dotgrid,
 * flowfield, contour). All read theme tokens so they adapt to mode and preset.
 */
export type BackgroundPageVariant =
  | "aurora"
  | "mesh"
  | "constellation"
  | "grid"
  | "orbs"
  | "waves"
  | "starfield"
  | "spotlight"
  | "ripple"
  | "dotgrid"
  | "flowfield"
  | "contour"

export interface BackgroundPageVariantMeta {
  value: BackgroundPageVariant
  label: string
  description: string
  /** True when the variant renders to <canvas> rather than pure CSS. */
  canvas: boolean
}

export const BACKGROUND_PAGE_VARIANTS: readonly BackgroundPageVariantMeta[] = [
  {
    value: "aurora",
    label: "Aurora",
    description:
      "Soft, drifting ribbons of light. The glow leans toward the pointer.",
    canvas: false,
  },
  {
    value: "mesh",
    label: "Mesh Gradient",
    description:
      "Breathing gradient blobs with a tint that follows the cursor.",
    canvas: false,
  },
  {
    value: "constellation",
    label: "Constellation",
    description:
      "A drifting particle network with glowing accents that links to neighbours and scatters from the cursor.",
    canvas: true,
  },
  {
    value: "grid",
    label: "Perspective Grid",
    description: "A receding neon grid that parallax-tilts under the pointer.",
    canvas: false,
  },
  {
    value: "orbs",
    label: "Floating Orbs",
    description: "Layered bokeh spheres with depth-aware parallax.",
    canvas: false,
  },
  {
    value: "waves",
    label: "Waves",
    description: "Stacked sine bands whose amplitude reacts to the cursor.",
    canvas: true,
  },
  {
    value: "starfield",
    label: "Starfield",
    description:
      "Depth-projected stars drifting toward the viewer with parallax.",
    canvas: true,
  },
  {
    value: "spotlight",
    label: "Spotlight",
    description:
      "A refined dotted surface lit by a glow that tracks the cursor.",
    canvas: false,
  },
  {
    value: "ripple",
    label: "Ripple",
    description:
      "Expanding sonar-like wavefronts; ambient ripples drift while a click or tap sends out a bright one.",
    canvas: true,
  },
  {
    value: "dotgrid",
    label: "Dot Grid",
    description:
      "A breathing dot lattice that bulges and brightens under a magnetic lens around the cursor.",
    canvas: true,
  },
  {
    value: "flowfield",
    label: "Flow Field",
    description:
      "Particles streaming along a living noise field, leaving fading trails and swirling around the cursor.",
    canvas: true,
  },
  {
    value: "contour",
    label: "Contour Map",
    description:
      "Animated topographic iso-lines that bunch into a hill rising under the cursor.",
    canvas: true,
  },
]

const CANVAS_VARIANTS = new Set<BackgroundPageVariant>([
  "constellation",
  "waves",
  "starfield",
  "ripple",
  "dotgrid",
  "flowfield",
  "contour",
])

export function isCanvasVariant(variant: BackgroundPageVariant): boolean {
  return CANVAS_VARIANTS.has(variant)
}

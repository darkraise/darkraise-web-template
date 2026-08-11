export interface Oklch {
  L: number
  C: number
  /** Radians, as returned by Math.atan2. */
  h: number
}

const GAMUT_EPSILON = 1e-4
const CHROMA_STEP = 0.002

type Triple = [number, number, number]

function srgbToLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4)
}

function linearToSrgb(channel: number): number {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055
}

function hslToSrgb(hsl: string): Triple {
  const parts = hsl.trim().split(/\s+/)
  const hue = parseFloat(parts[0] ?? "0")
  const saturation = parseFloat(parts[1] ?? "0") / 100
  const lightness = parseFloat(parts[2] ?? "0") / 100

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
  const offset = lightness - chroma / 2
  const sector = ((Math.floor(hue / 60) % 6) + 6) % 6
  const sectors: Triple[] = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ]
  const [r, g, b] = sectors[sector] as Triple
  return [r + offset, g + offset, b + offset]
}

function srgbToHsl([r, g, b]: Triple): string {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2

  let hue = 0
  let saturation = 0
  if (max !== min) {
    const delta = max - min
    saturation = delta / (1 - Math.abs(2 * lightness - 1))
    if (max === r) hue = 60 * (((g - b) / delta) % 6)
    else if (max === g) hue = 60 * ((b - r) / delta + 2)
    else hue = 60 * ((r - g) / delta + 4)
  }
  if (hue < 0) hue += 360

  return `${Math.round(hue) % 360} ${Math.round(saturation * 100)}% ${Math.round(
    lightness * 100,
  )}%`
}

function linearToOklch([lr, lg, lb]: Triple): Oklch {
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s

  return { L, C: Math.hypot(a, b), h: Math.atan2(b, a) }
}

function oklchToLinear({ L, C, h }: Oklch): Triple {
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function inGamut(triple: Triple): boolean {
  return triple.every((v) => v >= -GAMUT_EPSILON && v <= 1 + GAMUT_EPSILON)
}

export function hslStringToOklch(hsl: string): Oklch {
  const [r, g, b] = hslToSrgb(hsl)
  return linearToOklch([srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)])
}

/**
 * Walks chroma down until the colour falls inside sRGB rather than clipping
 * the channels, so an out-of-gamut request keeps its hue and lightness and
 * loses only saturation.
 */
export function oklchToHslString(color: Oklch): string {
  let chroma = color.C
  while (chroma > 0 && !inGamut(oklchToLinear({ ...color, C: chroma }))) {
    chroma -= CHROMA_STEP
  }

  const linear = oklchToLinear({ ...color, C: Math.max(chroma, 0) })
  const encoded = linear.map((v) =>
    linearToSrgb(Math.min(1, Math.max(0, v))),
  ) as Triple

  return srgbToHsl(encoded)
}

export function relativeLuminance(hsl: string): number {
  const [r, g, b] = hslToSrgb(hsl)
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  )
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

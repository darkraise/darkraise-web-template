export interface RGB {
  r: number
  g: number
  b: number
}

export interface HSV {
  h: number
  s: number
  v: number
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function normalizeHex(input: string): string | null {
  const match = HEX_PATTERN.exec(input.trim())
  if (!match || !match[1]) return null
  let hex = match[1].toLowerCase()
  if (hex.length === 3 || hex.length === 4) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("")
  }
  return `#${hex}`
}

export function hexToRgb(hex: string): RGB | null {
  const normalized = normalizeHex(hex)
  if (!normalized) return null
  const value = normalized.slice(1)
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null
  return { r, g, b }
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function toHex2(n: number): string {
  return clampByte(n).toString(16).padStart(2, "0")
}

export function rgbToHex({ r, g, b }: RGB): string {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rN = r / 255
  const gN = g / 255
  const bN = b / 255
  const max = Math.max(rN, gN, bN)
  const min = Math.min(rN, gN, bN)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === rN) h = ((gN - bN) / delta) % 6
    else if (max === gN) h = (bN - rN) / delta + 2
    else h = (rN - gN) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : (delta / max) * 100
  const v = max * 100
  return { h, s, v }
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const hN = ((h % 360) + 360) % 360
  const sN = Math.max(0, Math.min(100, s)) / 100
  const vN = Math.max(0, Math.min(100, v)) / 100
  const c = vN * sN
  const x = c * (1 - Math.abs(((hN / 60) % 2) - 1))
  const m = vN - c
  let rP = 0
  let gP = 0
  let bP = 0
  if (hN < 60) {
    rP = c
    gP = x
  } else if (hN < 120) {
    rP = x
    gP = c
  } else if (hN < 180) {
    gP = c
    bP = x
  } else if (hN < 240) {
    gP = x
    bP = c
  } else if (hN < 300) {
    rP = x
    bP = c
  } else {
    rP = c
    bP = x
  }
  return {
    r: Math.round((rP + m) * 255),
    g: Math.round((gP + m) * 255),
    b: Math.round((bP + m) * 255),
  }
}

export function hexToHsv(hex: string): HSV | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  return rgbToHsv(rgb)
}

export function hsvToHex(hsv: HSV): string {
  return rgbToHex(hsvToRgb(hsv))
}

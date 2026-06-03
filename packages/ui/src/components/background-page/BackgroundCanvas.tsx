import * as React from "react"
import type { BackgroundPageVariant } from "./variants"

interface BackgroundCanvasProps {
  variant: BackgroundPageVariant
  interactive: boolean
  reducedMotion: boolean
  /** Motion-rate multiplier (clamped by the caller). */
  speed: number
  /** Particle/dot count multiplier (clamped by the caller). */
  density: number
}

interface Pointer {
  x: number
  y: number
  active: boolean
}

interface ThemeColors {
  primary: string
  foreground: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  accent: boolean
  shade: number
}

interface Star {
  x: number
  y: number
  z: number
  tw: number
}

interface Ripple {
  x: number
  y: number
  /** Age in 60Hz frame-units, advanced by dt. */
  age: number
  life: number
  speed: number
  strength: number
  accent: boolean
}

interface FlowParticle {
  x: number
  y: number
  age: number
  life: number
  speed: number
  shade: number
}

const FALLBACK: ThemeColors = {
  primary: "217 91% 60%",
  foreground: "222 47% 11%",
}

function hsla(triplet: string, alpha: number): string {
  return `hsl(${triplet} / ${alpha})`
}

function readColors(node: Element): ThemeColors {
  const cs = getComputedStyle(node)
  const read = (name: string, fallback: string) =>
    cs.getPropertyValue(name).trim() || fallback
  return {
    primary: read("--primary", FALLBACK.primary),
    foreground: read("--foreground", FALLBACK.foreground),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Parse an HSL triplet token ("217 91% 60%") into numeric components. */
function parseHsl(triplet: string): { h: number; s: number; l: number } {
  const parts = triplet.replace(/%/g, "").trim().split(/\s+/)
  const h = Number(parts[0])
  const s = Number(parts[1])
  const l = Number(parts[2])
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
    return { h: 217, s: 91, l: 60 }
  }
  return { h, s, l }
}

/**
 * Cheap dependency-free flow-field angle from layered sines (no lookup tables).
 * Spatial frequencies are incommensurate so the field never visibly tiles; t
 * slowly rotates the whole field for a living drift.
 */
function flowAngle(x: number, y: number, t: number): number {
  const n =
    Math.sin(x * 0.0042 + t) +
    Math.sin(y * 0.0036 - t * 0.8) +
    Math.sin((x + y) * 0.0026 + t * 0.6) +
    Math.sin((x - y) * 0.0031 - t * 0.4) * 0.7
  return n * 1.45
}

/** Cheap dependency-free layered-sine scalar field in ~[-1, 1] for contours. */
function contourNoise(x: number, y: number, t: number): number {
  let v = 0
  v += Math.sin(x * 1.7 + t) * Math.cos(y * 1.3 - t * 0.8)
  v += Math.sin(x * 3.1 - t * 0.6 + y * 0.9) * 0.5
  v += Math.cos(x * 5.3 + y * 4.1 + t * 1.3) * 0.25
  return v / 1.75
}

/**
 * Canvas-backed renderer for the seven canvas variants (constellation, waves,
 * starfield, ripple, dotgrid, flowfield, contour). The other five variants are
 * pure CSS. Self-contained: it owns its own DPR sizing, resize observation,
 * pointer listeners, visibility pausing, and rAF loop, and reads theme tokens
 * off the canvas so it tracks mode + preset.
 */
export function BackgroundCanvas({
  variant,
  interactive,
  reducedMotion,
  speed,
  density,
}: BackgroundCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  // Read speed through a ref so changing it scales motion live without tearing
  // down the canvas; density is in the effect deps since it rebuilds counts.
  const speedRef = React.useRef(speed)
  speedRef.current = speed

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = 1
    let colors = readColors(canvas)
    let particles: Particle[] = []
    let stars: Star[] = []
    let ripples: Ripple[] = []
    let ambientCooldown = 0
    let gridPhase = 0
    let flow: FlowParticle[] = []
    let flowTime = 0
    let contourCols = 0
    let contourRows = 0
    let contourField = new Float32Array(0)
    let contourT = 0
    let phase = 0
    let frame = 0
    let rafId = 0
    let lastTs = 0
    let domRect: DOMRect = canvas.getBoundingClientRect()

    const pointer: Pointer = { x: 0, y: 0, active: false }
    const eased = { x: 0, y: 0 }

    // Downgrade on touch / low-core devices: fewer particles and no cursor
    // interaction, so finger-tracking repulsion doesn't fight typing on mobile.
    const lowEnd =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(pointer: coarse)").matches ||
          (navigator.hardwareConcurrency ?? 8) <= 4
        : false

    const initState = () => {
      const area = width * height
      if (variant === "constellation") {
        const base = Math.round(area * 0.00012 * density)
        const count = lowEnd ? clamp(base, 22, 90) : clamp(base, 30, 170)
        particles = Array.from({ length: count }, () => {
          const accent = Math.random() < 0.18
          return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            r: accent ? 2 + Math.random() * 1.4 : 1.3 + Math.random() * 1.5,
            accent,
            shade: Math.random(),
          }
        })
      } else if (variant === "starfield") {
        const count = Math.min(
          280,
          Math.max(70, Math.round((area / 5200) * density)),
        )
        stars = Array.from({ length: count }, () => ({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          z: Math.random() * 0.9 + 0.1,
          tw: Math.random() * Math.PI * 2,
        }))
      } else if (variant === "ripple") {
        ripples = []
        ambientCooldown = 30
        // Seed a few centred concentric rings so the reduced-motion still
        // frame (and the first paint) is composed, never blank.
        const seeds = [0.22, 0.5, 0.78]
        for (let i = 0; i < seeds.length; i++) {
          const t = seeds[i]
          if (t === undefined) continue
          ripples.push({
            x: width / 2,
            y: height / 2,
            age: t * 150,
            life: 150,
            speed: clamp(Math.min(width, height) / 240, 1.1, 2.4),
            strength: 0.5,
            accent: i === 1,
          })
        }
      } else if (variant === "flowfield") {
        const base = Math.round((area / 5200) * density)
        const count = lowEnd ? clamp(base, 60, 320) : clamp(base, 90, 620)
        flow = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          age: Math.random(),
          life: 0.6 + Math.random() * 0.9,
          speed: 0.7 + Math.random() * 1.1,
          shade: Math.random(),
        }))
        flowTime = 0
      } else if (variant === "contour") {
        const cell = lowEnd ? 30 : 24
        contourCols = Math.max(2, Math.ceil(width / cell) + 1)
        contourRows = Math.max(2, Math.ceil(height / cell) + 1)
        contourField = new Float32Array(contourCols * contourRows)
        contourT = 0
      }
    }

    const resize = () => {
      domRect = canvas.getBoundingClientRect()
      width = Math.max(0, Math.round(domRect.width))
      height = Math.max(0, Math.round(domRect.height))
      dpr =
        typeof window !== "undefined"
          ? Math.min(window.devicePixelRatio || 1, 2)
          : 1
      canvas.width = Math.max(1, Math.round(width * dpr))
      canvas.height = Math.max(1, Math.round(height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      eased.x = width / 2
      eased.y = height / 2
      pointer.x = width / 2
      pointer.y = height / 2
      initState()
    }

    const drawConstellation = (dt: number) => {
      ctx.clearRect(0, 0, width, height)
      const linkDist = clamp(width / 10, 120, 150)
      const linkDist2 = linkDist * linkDist
      const mouseLink = 180
      const mouseLink2 = mouseLink * mouseLink
      const repel = 110
      // Node hue comes straight from --primary; the accent tier is a
      // hue-shifted, brighter sibling so the field reads as two harmonious
      // colours under any theme (mirrors darkmem's indigo nodes + cyan accents
      // without hardcoding either).
      const { h, s, l } = parseHsl(colors.primary)
      const accentHue = (((h - 42) % 360) + 360) % 360
      const accentSat = Math.min(100, s + 6)
      const accentLight = Math.min(92, l + 20)
      const accentBase = `${accentHue} ${accentSat}% ${accentLight}%`
      const cursor = pointer.active && !lowEnd

      // Drift + cursor repulsion (position-based, dt-scaled), edges bounce.
      for (const p of particles) {
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.x < 0) {
          p.x = 0
          p.vx *= -1
        } else if (p.x > width) {
          p.x = width
          p.vx *= -1
        }
        if (p.y < 0) {
          p.y = 0
          p.vy *= -1
        } else if (p.y > height) {
          p.y = height
          p.vy *= -1
        }
        if (cursor) {
          const dx = p.x - eased.x
          const dy = p.y - eased.y
          const d2 = dx * dx + dy * dy
          if (d2 < repel * repel && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const f = ((repel - d) / repel) * 2.2 * dt
            p.x += (dx / d) * f
            p.y += (dy / d) * f
          }
        }
      }

      // Links: node-to-node in the node hue, cursor links in the accent hue.
      ctx.lineWidth = 1
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        if (!a) continue
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          if (!b) continue
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 < linkDist2) {
            const d = Math.sqrt(d2)
            ctx.strokeStyle = hsla(colors.primary, (1 - d / linkDist) * 0.5)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        if (cursor) {
          const dx = a.x - eased.x
          const dy = a.y - eased.y
          const d2 = dx * dx + dy * dy
          if (d2 < mouseLink2) {
            const d = Math.sqrt(d2)
            ctx.strokeStyle = hsla(accentBase, (1 - d / mouseLink) * 0.75)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(eased.x, eased.y)
            ctx.stroke()
          }
        }
      }

      // Nodes: accent particles are larger and glow.
      for (const p of particles) {
        const color = p.accent
          ? `hsl(${accentHue} ${accentSat}% ${clamp(
              accentLight + (p.shade - 0.5) * 10,
              40,
              96,
            )}%)`
          : `hsl(${h} ${s}% ${clamp(l + (p.shade - 0.5) * 18, 24, 92)}%)`
        ctx.fillStyle = color
        ctx.shadowColor = p.accent ? color : "transparent"
        ctx.shadowBlur = p.accent ? 8 : 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
    }

    const drawWaves = (dt: number) => {
      ctx.clearRect(0, 0, width, height)
      phase += dt * 0.012
      const cursorY = pointer.active ? eased.y / height : 0.5
      const cursorX = pointer.active ? eased.x / width : 0.5
      const layers = 3
      for (let i = 0; i < layers; i++) {
        const baseline = height * (0.52 + i * 0.135)
        const amp = height * 0.05 * (1 + i * 0.5) * (0.7 + (1 - cursorY) * 0.9)
        const len = width / (1.1 + i * 0.35)
        const speed = phase * (1 + i * 0.45) + cursorX * 1.5
        ctx.beginPath()
        ctx.moveTo(0, height)
        ctx.lineTo(0, baseline)
        for (let x = 0; x <= width; x += 8) {
          const y =
            baseline +
            Math.sin(x / len + speed) * amp +
            Math.sin(x / (len * 0.5) + speed * 1.4) * amp * 0.35
          ctx.lineTo(x, y)
        }
        ctx.lineTo(width, height)
        ctx.closePath()
        ctx.fillStyle = hsla(colors.primary, 0.1 + i * 0.05)
        ctx.fill()
      }
    }

    const drawStarfield = (dt: number) => {
      ctx.clearRect(0, 0, width, height)
      const cx = width / 2 + (eased.x - width / 2) * 0.12
      const cy = height / 2 + (eased.y - height / 2) * 0.12
      const scale = Math.min(width, height) * 0.7
      const speed = 0.0009 * dt
      let i = 0
      for (const s of stars) {
        s.z -= speed
        if (s.z <= 0.04) {
          s.x = Math.random() * 2 - 1
          s.y = Math.random() * 2 - 1
          s.z = 1
          s.tw = Math.random() * Math.PI * 2
        }
        const px = cx + (s.x / s.z) * scale
        const py = cy + (s.y / s.z) * scale
        if (px < -4 || px > width + 4 || py < -4 || py > height + 4) {
          i++
          continue
        }
        s.tw += dt * 0.05
        const depth = 1 - s.z
        const radius = depth * 1.9 + 0.25
        const twinkle = 0.65 + Math.sin(s.tw) * 0.35
        const alpha = Math.min(1, depth * 1.2) * twinkle
        ctx.fillStyle = hsla(
          i % 9 === 0 ? colors.primary : colors.foreground,
          alpha,
        )
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fill()
        i++
      }
    }

    const drawRipple = (dt: number) => {
      ctx.clearRect(0, 0, width, height)
      const { h, s, l } = parseHsl(colors.primary)
      const accentHue = (((h - 42) % 360) + 360) % 360
      const accentSat = Math.min(100, s + 6)
      const accentLight = Math.min(92, l + 20)
      const accentBase = `${accentHue} ${accentSat}% ${accentLight}%`

      // Occasionally birth a faint ambient ripple; cap the field so a long-idle
      // screen never accumulates clutter.
      ambientCooldown -= dt
      if (ambientCooldown <= 0 && ripples.length < 14) {
        ambientCooldown = 80 + Math.random() * 120
        const maxDim = Math.max(width, height)
        ripples.push({
          x: width * (0.12 + Math.random() * 0.76),
          y: height * (0.12 + Math.random() * 0.76),
          age: 0,
          life: 150 + Math.random() * 60,
          speed: clamp(maxDim / 360, 1.1, 2.6),
          strength: 0.18 + Math.random() * 0.1,
          accent: false,
        })
      }

      ctx.lineWidth = 1.4
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i]
        if (!r) continue
        r.age += dt
        const t = r.age / r.life
        if (t >= 1) continue
        const radius = r.age * r.speed
        const fade = Math.sin((1 - t) * (Math.PI / 2))
        const spread = 1 / (1 + radius / 260)
        const base = r.accent ? accentBase : colors.primary
        const alpha = clamp(r.strength * fade * spread, 0, 0.6)
        if (alpha <= 0.004) continue
        ctx.strokeStyle = hsla(base, alpha)
        ctx.beginPath()
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx.stroke()
        const inner = radius - 9
        if (inner > 1) {
          ctx.strokeStyle = hsla(base, alpha * 0.4)
          ctx.beginPath()
          ctx.arc(r.x, r.y, inner, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // Compact out fully-faded ripples in place (no per-frame allocation).
      let w = 0
      for (let i = 0; i < ripples.length; i++) {
        const r = ripples[i]
        if (!r) continue
        if (r.age / r.life < 1) {
          ripples[w] = r
          w++
        }
      }
      ripples.length = w
    }

    const drawDotGrid = (dt: number) => {
      ctx.clearRect(0, 0, width, height)
      gridPhase += dt * 0.018
      const { h, s, l } = parseHsl(colors.primary)
      const accentHue = (((h - 42) % 360) + 360) % 360
      const accentSat = Math.min(100, s + 8)
      const accentLight = Math.min(94, l + 18)

      const minSpan = Math.min(width, height)
      const spacing = clamp(
        Math.round(minSpan / 22 / Math.sqrt(density)),
        26,
        52,
      )
      const radius = clamp(minSpan * 0.012, 22, 70) * 6
      const radius2 = radius * radius
      const cols = Math.ceil(width / spacing)
      const rows = Math.ceil(height / spacing)
      const offsetX = (width - cols * spacing) / 2 + spacing / 2
      const offsetY = (height - rows * spacing) / 2 + spacing / 2

      const cursor = pointer.active && !lowEnd
      const cx = cursor ? eased.x : width / 2
      const cy = cursor ? eased.y : height / 2
      // Park a gentle bulge dead-centre under reduced motion; otherwise the
      // idle lattice just breathes (no permanent centre bulge).
      const lensGain = cursor ? 1 : reducedMotion ? 0.7 : 0

      const baseDot = clamp(spacing * 0.07, 0.9, 2.2)
      const baseAlpha = 0.22

      for (let row = 0; row <= rows; row++) {
        const gy = offsetY + row * spacing
        if (gy < -radius || gy > height + radius) continue
        for (let col = 0; col <= cols; col++) {
          const gx = offsetX + col * spacing
          const breathe =
            Math.sin(gx * 0.012 + gy * 0.012 + gridPhase) * 0.5 + 0.5
          const dx = gx - cx
          const dy = gy - cy
          const d2 = dx * dx + dy * dy

          let influence = 0
          let px = gx
          let py = gy
          if (lensGain > 0 && d2 < radius2) {
            const d = Math.sqrt(d2) || 0.0001
            influence = (1 - d / radius) * lensGain
            influence = influence * influence
            const push = influence * spacing * 0.55
            px = gx + (dx / d) * push
            py = gy + (dy / d) * push
          }

          const dotR =
            baseDot * (1 + breathe * 0.35) + influence * (radius * 0.012 + 1.6)
          const alpha = clamp(
            baseAlpha + breathe * 0.12 + influence * 0.75,
            0,
            1,
          )

          let dh = h
          let ds = s
          let dl = clamp(l + breathe * 6 + influence * 22, 18, 96)
          if (influence > 0.45) {
            const tt = (influence - 0.45) / 0.55
            dh = h + (accentHue - h) * tt
            ds = s + (accentSat - s) * tt
            dl = dl + (accentLight - dl) * tt * 0.6
          }

          ctx.fillStyle = hsla(`${dh} ${ds}% ${dl}%`, alpha)
          ctx.beginPath()
          ctx.arc(px, py, dotR, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const drawFlowField = (dt: number) => {
      // Trail persistence on a transparent canvas: erase a little each frame
      // with destination-out so old strokes fade to transparent (revealing the
      // page background) rather than accumulating a coloured veil. dt-scaled so
      // trail length is refresh-rate independent.
      const fadeAlpha = clamp(0.085 * dt, 0.04, 0.22)
      ctx.globalCompositeOperation = "destination-out"
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = "source-over"

      const { h, s, l } = parseHsl(colors.primary)
      const accentHue = (((h - 42) % 360) + 360) % 360
      const accentSat = Math.min(100, s + 8)
      const accentLight = Math.min(94, l + 22)

      flowTime += dt * 0.0023
      const t = flowTime
      const cursor = pointer.active && !lowEnd
      const ex = eased.x
      const ey = eased.y
      const swirlR = Math.min(width, height) * 0.32
      const swirlR2 = swirlR * swirlR
      const step = 1.4

      ctx.lineCap = "round"

      for (let i = 0; i < flow.length; i++) {
        const p = flow[i]
        if (!p) continue
        const ang = flowAngle(p.x, p.y, t)
        let vx = Math.cos(ang) * p.speed * step
        let vy = Math.sin(ang) * p.speed * step
        if (cursor) {
          const dx = p.x - ex
          const dy = p.y - ey
          const d2 = dx * dx + dy * dy
          if (d2 < swirlR2 && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const fall = 1 - d / swirlR
            const rot = fall * 1.6
            const cos = Math.cos(rot)
            const sin = Math.sin(rot)
            const rvx = vx * cos - vy * sin
            const rvy = vx * sin + vy * cos
            const push = (fall * 1.1) / d
            vx = rvx + dx * push
            vy = rvy + dy * push
          }
        }
        const nx = p.x + vx * dt
        const ny = p.y + vy * dt
        p.age += dt / 60 / p.life
        const tAge = clamp(p.age, 0, 1)
        const ch = h + (accentHue - h) * tAge
        const cs = s + (accentSat - s) * tAge
        const cl = l + (accentLight - l) * tAge + (p.shade - 0.5) * 10
        const env = Math.sin(Math.min(tAge, 1) * Math.PI)
        const alpha = 0.18 + env * 0.5
        ctx.strokeStyle = `hsl(${ch} ${clamp(cs, 0, 100)}% ${clamp(
          cl,
          14,
          96,
        )}% / ${alpha})`
        ctx.lineWidth = 0.7 + tAge * 0.8
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(nx, ny)
        ctx.stroke()
        p.x = nx
        p.y = ny
        if (
          p.age >= 1 ||
          p.x < -4 ||
          p.x > width + 4 ||
          p.y < -4 ||
          p.y > height + 4
        ) {
          p.x = Math.random() * width
          p.y = Math.random() * height
          p.age = 0
          p.life = 0.6 + Math.random() * 0.9
          p.speed = 0.7 + Math.random() * 1.1
          p.shade = Math.random()
        }
      }
    }

    // Reduced-motion still: trails need a loop, so paint a one-shot snapshot of
    // the field as short oriented segments on a grid (primary at centre fading
    // toward the accent hue at the edges).
    const drawFlowFieldStill = () => {
      ctx.clearRect(0, 0, width, height)
      const { h, s, l } = parseHsl(colors.primary)
      const accentHue = (((h - 42) % 360) + 360) % 360
      const accentSat = Math.min(100, s + 8)
      const accentLight = Math.min(94, l + 22)
      const spacing = Math.max(34, Math.min(width, height) / 18)
      const len = spacing * 0.42
      const cx = width / 2
      const cy = height / 2
      const maxDist = Math.hypot(cx, cy) || 1
      ctx.lineCap = "round"
      ctx.lineWidth = 1
      for (let y = spacing / 2; y < height; y += spacing) {
        for (let x = spacing / 2; x < width; x += spacing) {
          const ang = flowAngle(x, y, 0)
          const dx = Math.cos(ang) * len
          const dy = Math.sin(ang) * len
          const dist = Math.min(1, Math.hypot(x - cx, y - cy) / maxDist)
          const ch = h + (accentHue - h) * dist
          const cs = s + (accentSat - s) * dist
          const cl = l + (accentLight - l) * dist
          ctx.strokeStyle = `hsl(${ch} ${clamp(cs, 0, 100)}% ${clamp(
            cl,
            14,
            96,
          )}% / 0.4)`
          ctx.beginPath()
          ctx.moveTo(x - dx / 2, y - dy / 2)
          ctx.lineTo(x + dx / 2, y + dy / 2)
          ctx.stroke()
        }
      }
      ctx.lineCap = "butt"
    }

    const drawContour = (dt: number) => {
      if (contourCols < 2 || contourRows < 2) return
      ctx.clearRect(0, 0, width, height)
      contourT += dt * 0.006
      const cols = contourCols
      const rows = contourRows
      const stepX = width / (cols - 1)
      const stepY = height / (rows - 1)

      // Gaussian bump under the cursor raises local terrain so contours bunch;
      // falls back to canvas centre when idle.
      const bumpX = eased.x
      const bumpY = eased.y
      const bumpAmp = pointer.active && !lowEnd ? 1.15 : 0.7
      const bumpSigma = Math.max(60, Math.min(width, height) * 0.22)
      const twoSigma2 = 2 * bumpSigma * bumpSigma
      const noiseScale = 0.012

      for (let r = 0; r < rows; r++) {
        const py = r * stepY
        const ny = py * noiseScale
        for (let c = 0; c < cols; c++) {
          const px = c * stepX
          const nx = px * noiseScale
          let v = contourNoise(nx, ny, contourT)
          const dx = px - bumpX
          const dy = py - bumpY
          v += bumpAmp * Math.exp(-(dx * dx + dy * dy) / twoSigma2)
          contourField[r * cols + c] = v
        }
      }

      const { h, s, l } = parseHsl(colors.primary)
      const accentHue = (((h - 42) % 360) + 360) % 360
      const accentSat = Math.min(100, s + 6)
      const accentLight = Math.min(92, l + 20)
      const accentBase = `${accentHue} ${accentSat}% ${accentLight}%`

      const levels = lowEnd
        ? [-0.6, -0.2, 0.2, 0.6, 1.0]
        : [-0.8, -0.45, -0.1, 0.25, 0.6, 0.95]
      const nLevels = levels.length

      const cursorValue =
        contourNoise(
          clamp(bumpX, 0, width) * noiseScale,
          clamp(bumpY, 0, height) * noiseScale,
          contourT,
        ) + bumpAmp
      let accentLevelIdx = 0
      let accentLevelDist = Infinity
      for (let i = 0; i < nLevels; i++) {
        const lev = levels[i]
        if (lev === undefined) continue
        const d = Math.abs(lev - cursorValue)
        if (d < accentLevelDist) {
          accentLevelDist = d
          accentLevelIdx = i
        }
      }

      ctx.lineWidth = 1
      ctx.lineCap = "round"

      const lerp = (level: number, va: number, vb: number): number => {
        const d = vb - va
        if (Math.abs(d) < 1e-6) return 0.5
        return (level - va) / d
      }

      for (let li = 0; li < nLevels; li++) {
        const level = levels[li]
        if (level === undefined) continue
        const isAccent = li === accentLevelIdx && pointer.active && !lowEnd
        const t01 = nLevels > 1 ? li / (nLevels - 1) : 1
        const alpha = isAccent ? 0.85 : 0.18 + t01 * 0.34
        ctx.strokeStyle = isAccent
          ? hsla(accentBase, alpha)
          : hsla(colors.primary, alpha)
        ctx.lineWidth = isAccent ? 1.5 : 1

        ctx.beginPath()
        for (let r = 0; r < rows - 1; r++) {
          const rowTop = r * cols
          const rowBot = (r + 1) * cols
          const yTop = r * stepY
          const yBot = (r + 1) * stepY
          for (let c = 0; c < cols - 1; c++) {
            const tl = contourField[rowTop + c]
            const tr = contourField[rowTop + c + 1]
            const br = contourField[rowBot + c + 1]
            const bl = contourField[rowBot + c]
            if (
              tl === undefined ||
              tr === undefined ||
              br === undefined ||
              bl === undefined
            )
              continue
            let caseIdx = 0
            if (tl > level) caseIdx |= 8
            if (tr > level) caseIdx |= 4
            if (br > level) caseIdx |= 2
            if (bl > level) caseIdx |= 1
            if (caseIdx === 0 || caseIdx === 15) continue

            const xLeft = c * stepX
            const xRight = (c + 1) * stepX
            const topX = xLeft + lerp(level, tl, tr) * stepX
            const rightY = yTop + lerp(level, tr, br) * stepY
            const botX = xLeft + lerp(level, bl, br) * stepX
            const leftY = yTop + lerp(level, tl, bl) * stepY

            switch (caseIdx) {
              case 1:
                ctx.moveTo(xLeft, leftY)
                ctx.lineTo(botX, yBot)
                break
              case 2:
                ctx.moveTo(botX, yBot)
                ctx.lineTo(xRight, rightY)
                break
              case 3:
                ctx.moveTo(xLeft, leftY)
                ctx.lineTo(xRight, rightY)
                break
              case 4:
                ctx.moveTo(topX, yTop)
                ctx.lineTo(xRight, rightY)
                break
              case 5:
                ctx.moveTo(xLeft, leftY)
                ctx.lineTo(topX, yTop)
                ctx.moveTo(botX, yBot)
                ctx.lineTo(xRight, rightY)
                break
              case 6:
                ctx.moveTo(topX, yTop)
                ctx.lineTo(botX, yBot)
                break
              case 7:
                ctx.moveTo(xLeft, leftY)
                ctx.lineTo(topX, yTop)
                break
              case 8:
                ctx.moveTo(xLeft, leftY)
                ctx.lineTo(topX, yTop)
                break
              case 9:
                ctx.moveTo(topX, yTop)
                ctx.lineTo(botX, yBot)
                break
              case 10:
                ctx.moveTo(xLeft, leftY)
                ctx.lineTo(botX, yBot)
                ctx.moveTo(topX, yTop)
                ctx.lineTo(xRight, rightY)
                break
              case 11:
                ctx.moveTo(topX, yTop)
                ctx.lineTo(xRight, rightY)
                break
              case 12:
                ctx.moveTo(xLeft, leftY)
                ctx.lineTo(xRight, rightY)
                break
              case 13:
                ctx.moveTo(botX, yBot)
                ctx.lineTo(xRight, rightY)
                break
              case 14:
                ctx.moveTo(xLeft, leftY)
                ctx.lineTo(botX, yBot)
                break
              default:
                break
            }
          }
        }
        ctx.stroke()
      }
      ctx.lineCap = "butt"
    }

    const render = (dt: number) => {
      if (width <= 0 || height <= 0) return
      // Frame-rate-independent easing: converge the same amount per unit time
      // regardless of refresh rate (dt is normalized to a 60 Hz step).
      const followK = 1 - Math.pow(1 - 0.12, dt)
      const idleK = 1 - Math.pow(1 - 0.06, dt)
      if (pointer.active) {
        eased.x += (pointer.x - eased.x) * followK
        eased.y += (pointer.y - eased.y) * followK
      } else {
        eased.x += (width / 2 - eased.x) * idleK
        eased.y += (height / 2 - eased.y) * idleK
      }
      // The speed factor scales the variant's own motion only; pointer easing
      // above stays on the true frame delta. Cap so a high speed + a long frame
      // (e.g. after a stall) can't take a destabilising jump.
      const mdt = Math.min(dt * speedRef.current, 4)
      if (variant === "waves") drawWaves(mdt)
      else if (variant === "starfield") drawStarfield(mdt)
      else if (variant === "ripple") drawRipple(mdt)
      else if (variant === "dotgrid") drawDotGrid(mdt)
      else if (variant === "flowfield") {
        if (reducedMotion) drawFlowFieldStill()
        else drawFlowField(mdt)
      } else if (variant === "contour") drawContour(mdt)
      else drawConstellation(mdt)
      frame++
      if (frame % 24 === 0) colors = readColors(canvas)
    }

    const loop = (ts: number) => {
      const delta = lastTs ? Math.min((ts - lastTs) / 16.67, 3) : 1
      lastTs = ts
      render(delta)
      rafId = requestAnimationFrame(loop)
    }

    // Pointer tracking via window so the layer's pointer-events:none is moot.
    // The rect is cached (refreshed on resize + scroll) to keep the high-rate
    // pointermove handler off the forced-reflow path.
    const onPointerMove = (event: PointerEvent) => {
      if (domRect.width === 0 || domRect.height === 0) return
      const x = event.clientX - domRect.left
      const y = event.clientY - domRect.top
      pointer.active =
        x >= 0 && x <= domRect.width && y >= 0 && y <= domRect.height
      if (pointer.active) {
        pointer.x = x
        pointer.y = y
      }
    }
    const clearPointer = () => {
      pointer.active = false
    }
    const onScroll = () => {
      domRect = canvas.getBoundingClientRect()
    }

    // Ripple is the only variant with discrete pointer interaction: a press (or
    // tap) spawns a bright accent ripple at the cursor. No-op for other variants.
    const onPointerDown = (event: PointerEvent) => {
      if (variant !== "ripple" || lowEnd) return
      if (domRect.width === 0 || domRect.height === 0) return
      const x = event.clientX - domRect.left
      const y = event.clientY - domRect.top
      if (x < 0 || x > domRect.width || y < 0 || y > domRect.height) return
      if (ripples.length >= 24) return
      const maxDim = Math.max(width, height)
      ripples.push({
        x,
        y,
        age: 0,
        life: 170,
        speed: clamp(maxDim / 300, 1.4, 3),
        strength: 0.55,
        accent: true,
      })
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (rafId) cancelAnimationFrame(rafId)
        rafId = 0
      } else if (!rafId && !reducedMotion) {
        lastTs = 0
        rafId = requestAnimationFrame(loop)
      }
    }

    // Setting canvas.width/height clears the bitmap, so any resize must be
    // followed by a repaint. The loop handles that for animated variants;
    // when no loop is running (reduced motion, or paused while hidden) we
    // repaint one static frame here so the background never goes blank.
    const onResize = () => {
      resize()
      if (!rafId) render(1)
    }

    resize()

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(onResize)
      observer.observe(canvas)
    } else if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize)
    }

    let themeObserver: MutationObserver | null = null

    if (reducedMotion) {
      // One composed static frame, no loop, no pointer. Repaint on theme
      // change so the still frame tracks mode + preset like the CSS variants.
      render(1)
      if (
        typeof MutationObserver !== "undefined" &&
        typeof document !== "undefined"
      ) {
        themeObserver = new MutationObserver(() => {
          colors = readColors(canvas)
          render(1)
        })
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class", "style", "data-mode", "data-preset"],
        })
      }
    } else {
      if (interactive && typeof window !== "undefined") {
        window.addEventListener("pointermove", onPointerMove, { passive: true })
        window.addEventListener("pointerdown", onPointerDown, { passive: true })
        window.addEventListener("scroll", onScroll, {
          passive: true,
          capture: true,
        })
        window.addEventListener("blur", clearPointer)
        if (typeof document !== "undefined") {
          document.documentElement.addEventListener(
            "pointerleave",
            clearPointer,
          )
        }
      }
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibility)
      }
      rafId = requestAnimationFrame(loop)
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (observer) observer.disconnect()
      else if (typeof window !== "undefined")
        window.removeEventListener("resize", onResize)
      if (themeObserver) themeObserver.disconnect()
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", onScroll, { capture: true })
        window.removeEventListener("pointermove", onPointerMove)
        window.removeEventListener("pointerdown", onPointerDown)
        window.removeEventListener("blur", clearPointer)
      }
      if (typeof document !== "undefined") {
        document.documentElement.removeEventListener(
          "pointerleave",
          clearPointer,
        )
        document.removeEventListener("visibilitychange", onVisibility)
      }
    }
  }, [variant, interactive, reducedMotion, density])

  return <canvas ref={canvasRef} className="dr-bg-canvas" aria-hidden="true" />
}

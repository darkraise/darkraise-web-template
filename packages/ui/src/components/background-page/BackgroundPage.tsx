import * as React from "react"
import { cn } from "@lib/utils"
import { useMediaQuery } from "@hooks"
import { BackgroundCanvas } from "./BackgroundCanvas"
import { isCanvasVariant, type BackgroundPageVariant } from "./variants"
import "./background-page.css"

export interface BackgroundPageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Which of the twelve predefined backgrounds to render. Defaults to "aurora". */
  variant?: BackgroundPageVariant
  /** Enable pointer reactivity (parallax / cursor glow). Defaults to true. */
  interactive?: boolean
  /**
   * Animation-rate multiplier for the active variant (drift, pulse, particle
   * motion, etc). 1 = default; clamped to 0.1–4. Applies to every variant.
   */
  speed?: number
  /**
   * Particle / dot density multiplier for the canvas-driven variants
   * (constellation, starfield, flow field, dot grid). 1 = default; clamped to
   * 0.25–3. No effect on the CSS-driven variants.
   */
  density?: number
  /**
   * Overall strength of the background as a layer-opacity multiplier, 0–1
   * (1 = full). Dims every variant uniformly.
   */
  intensity?: number
  /** Class applied to the content wrapper that holds `children`. */
  contentClassName?: string
  ref?: React.Ref<HTMLDivElement>
}

function AuroraLayer() {
  return (
    <div className="dr-bg-aurora">
      <div className="dr-bg-aurora-band" />
      <div className="dr-bg-aurora-band" />
      <div className="dr-bg-aurora-band" />
    </div>
  )
}

function MeshLayer() {
  return (
    <div className="dr-bg-mesh">
      <div className="dr-bg-mesh-blob" />
      <div className="dr-bg-mesh-blob" />
      <div className="dr-bg-mesh-blob" />
      <div className="dr-bg-mesh-blob" />
      <div className="dr-bg-mesh-cursor" />
    </div>
  )
}

function GridLayer() {
  return (
    <div className="dr-bg-grid">
      <div className="dr-bg-grid-plane" />
      <div className="dr-bg-grid-glow" />
      <div className="dr-bg-grid-scan" />
    </div>
  )
}

function OrbsLayer() {
  return (
    <div className="dr-bg-orbs">
      <div className="dr-bg-orb" />
      <div className="dr-bg-orb" />
      <div className="dr-bg-orb" />
      <div className="dr-bg-orb" />
      <div className="dr-bg-orb" />
      <div className="dr-bg-orb" />
    </div>
  )
}

function SpotlightLayer() {
  return (
    <div className="dr-bg-spotlight">
      <div className="dr-bg-spotlight-dots" />
      <div className="dr-bg-spotlight-glow" />
    </div>
  )
}

function CssVariantLayer({ variant }: { variant: BackgroundPageVariant }) {
  switch (variant) {
    case "mesh":
      return <MeshLayer />
    case "grid":
      return <GridLayer />
    case "orbs":
      return <OrbsLayer />
    case "spotlight":
      return <SpotlightLayer />
    case "aurora":
    default:
      return <AuroraLayer />
  }
}

function BackgroundPage({
  variant = "aurora",
  interactive = true,
  speed = 1,
  density = 1,
  intensity = 1,
  className,
  contentClassName,
  style,
  children,
  ref,
  ...rest
}: BackgroundPageProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const reducedMotion =
    useMediaQuery("(prefers-reduced-motion: reduce)") === true
  const canvas = isCanvasVariant(variant)
  const speedFactor = Math.min(4, Math.max(0.1, speed))
  const densityFactor = Math.min(3, Math.max(0.25, density))
  const intensityFactor = Math.min(1, Math.max(0, intensity))

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.RefObject<HTMLDivElement | null>).current = node
    },
    [ref],
  )

  // Pointer reactivity for the CSS variants: write --dr-bg-mx/--dr-bg-my on the
  // root, coalesced to one update per frame. Canvas variants track the pointer
  // themselves. Disabled under reduced motion or when interactive is off.
  React.useEffect(() => {
    const el = rootRef.current
    if (!el || canvas || !interactive || reducedMotion) return

    let raf = 0
    let nextX = 0.5
    let nextY = 0.5
    // Cache the rect so the high-rate pointermove handler doesn't force a
    // synchronous reflow on every event; refresh it on scroll + resize.
    let rect = el.getBoundingClientRect()

    const apply = () => {
      raf = 0
      el.style.setProperty("--dr-bg-mx", nextX.toFixed(4))
      el.style.setProperty("--dr-bg-my", nextY.toFixed(4))
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const refreshRect = () => {
      rect = el.getBoundingClientRect()
    }
    const onMove = (event: PointerEvent) => {
      if (!rect.width || !rect.height) return
      nextX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
      nextY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
      schedule()
    }
    const onLeave = () => {
      nextX = 0.5
      nextY = 0.5
      schedule()
    }

    el.addEventListener("pointermove", onMove, { passive: true })
    el.addEventListener("pointerleave", onLeave)
    window.addEventListener("scroll", refreshRect, {
      passive: true,
      capture: true,
    })
    window.addEventListener("resize", refreshRect)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("scroll", refreshRect, { capture: true })
      window.removeEventListener("resize", refreshRect)
      el.style.removeProperty("--dr-bg-mx")
      el.style.removeProperty("--dr-bg-my")
    }
  }, [canvas, interactive, reducedMotion, variant])

  return (
    <div
      {...rest}
      ref={setRef}
      className={cn("dr-background-page", className)}
      data-variant={variant}
      data-interactive={interactive ? "true" : "false"}
      data-motion={reducedMotion ? "reduced" : "full"}
      style={
        {
          "--dr-bg-speed": speedFactor,
          "--dr-bg-intensity": intensityFactor,
          ...style,
        } as React.CSSProperties
      }
    >
      <div className="dr-background-page-layer" aria-hidden="true">
        {canvas ? (
          <BackgroundCanvas
            variant={variant}
            interactive={interactive}
            reducedMotion={reducedMotion}
            speed={speedFactor}
            density={densityFactor}
          />
        ) : (
          <CssVariantLayer variant={variant} />
        )}
      </div>
      {children != null ? (
        <div className={cn("dr-background-page-content", contentClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  )
}

export { BackgroundPage }

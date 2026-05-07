import * as React from "react"
import { useEvent } from "@primitives/state"

export type CarouselOrientation = "horizontal" | "vertical"
export type CarouselAlign = "start" | "center" | "end"

export interface CarouselApi {
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
  canScrollPrev: () => boolean
  canScrollNext: () => boolean
  selectedScrollSnap: () => number
  on: (event: "select" | "reInit", handler: () => void) => void
  off: (event: "select" | "reInit", handler: () => void) => void
}

export interface UseCarouselOptions {
  orientation?: CarouselOrientation
  loop?: boolean
  align?: CarouselAlign
  dragFree?: boolean
  startIndex?: number
  autoplay?: { delay: number; pauseOnHover?: boolean }
}

export interface UseCarouselReturn {
  viewportRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  selectedIndex: number
  canScrollPrev: boolean
  canScrollNext: boolean
  orientation: CarouselOrientation
  scrollPrev: () => void
  scrollNext: () => void
  scrollTo: (index: number) => void
  api: CarouselApi
  registerHover: (hovered: boolean) => void
}

const DRAG_THRESHOLD_PX = 24

function getSlideEls(content: HTMLElement | null): HTMLElement[] {
  if (!content) return []
  return Array.from(content.children).filter(
    (n): n is HTMLElement => n instanceof HTMLElement,
  )
}

function findIndexForOffset(
  slides: HTMLElement[],
  offset: number,
  axis: "x" | "y",
  align: CarouselAlign,
  viewportSize: number,
): number {
  if (slides.length === 0) return 0
  let bestIndex = 0
  let bestDelta = Infinity
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i]
    if (!slide) continue
    const slidePos = axis === "x" ? slide.offsetLeft : slide.offsetTop
    const slideSize = axis === "x" ? slide.offsetWidth : slide.offsetHeight
    let target = slidePos
    if (align === "center") target = slidePos - (viewportSize - slideSize) / 2
    else if (align === "end") target = slidePos - (viewportSize - slideSize)
    const delta = Math.abs(target - offset)
    if (delta < bestDelta) {
      bestDelta = delta
      bestIndex = i
    }
  }
  return bestIndex
}

function targetForIndex(
  slides: HTMLElement[],
  index: number,
  axis: "x" | "y",
  align: CarouselAlign,
  viewportSize: number,
): number {
  const slide = slides[index]
  if (!slide) return 0
  const slidePos = axis === "x" ? slide.offsetLeft : slide.offsetTop
  const slideSize = axis === "x" ? slide.offsetWidth : slide.offsetHeight
  if (align === "center") return slidePos - (viewportSize - slideSize) / 2
  if (align === "end") return slidePos - (viewportSize - slideSize)
  return slidePos
}

export function useCarousel(
  options: UseCarouselOptions = {},
): UseCarouselReturn {
  const {
    orientation = "horizontal",
    loop = false,
    align = "start",
    dragFree = false,
    startIndex = 0,
    autoplay,
  } = options

  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const axis: "x" | "y" = orientation === "horizontal" ? "x" : "y"

  const [selectedIndex, setSelectedIndex] = React.useState(startIndex)
  const [slideCount, setSlideCount] = React.useState(0)
  const [hovered, setHovered] = React.useState(false)

  const listenersRef = React.useRef({
    select: new Set<() => void>(),
    reInit: new Set<() => void>(),
  })

  const fire = useEvent((kind: "select" | "reInit") => {
    listenersRef.current[kind].forEach((handler) => handler())
  })

  const measure = useEvent(() => {
    const content = contentRef.current
    if (!content) return { slides: [] as HTMLElement[], viewportSize: 0 }
    const viewport = viewportRef.current
    if (!viewport) return { slides: [], viewportSize: 0 }
    const slides = getSlideEls(content)
    const viewportSize =
      axis === "x" ? viewport.clientWidth : viewport.clientHeight
    return { slides, viewportSize }
  })

  const scrollToIndex = useEvent((index: number, smooth = true) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const { slides, viewportSize } = measure()
    if (slides.length === 0) return
    const next = loop
      ? ((index % slides.length) + slides.length) % slides.length
      : Math.max(0, Math.min(slides.length - 1, index))
    const target = targetForIndex(slides, next, axis, align, viewportSize)
    if (axis === "x") {
      viewport.scrollTo({
        left: Math.max(0, target),
        behavior: smooth ? "smooth" : "auto",
      })
    } else {
      viewport.scrollTo({
        top: Math.max(0, target),
        behavior: smooth ? "smooth" : "auto",
      })
    }
    setSelectedIndex(next)
    fire("select")
  })

  const scrollPrev = useEvent(() => {
    if (loop && slideCount > 0) {
      scrollToIndex(selectedIndex - 1)
      return
    }
    if (selectedIndex <= 0) return
    scrollToIndex(selectedIndex - 1)
  })

  const scrollNext = useEvent(() => {
    if (loop && slideCount > 0) {
      scrollToIndex(selectedIndex + 1)
      return
    }
    if (selectedIndex >= slideCount - 1) return
    scrollToIndex(selectedIndex + 1)
  })

  // Recompute slide count whenever children change.
  React.useEffect(() => {
    const content = contentRef.current
    if (!content) return
    const sync = () => {
      const next = getSlideEls(content).length
      setSlideCount((prev) => {
        if (prev !== next) {
          fire("reInit")
        }
        return next
      })
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(content, { childList: true })
    return () => observer.disconnect()
  }, [fire])

  // Initial scroll
  React.useEffect(() => {
    if (startIndex > 0) {
      const id = window.requestAnimationFrame(() => {
        scrollToIndex(startIndex, false)
      })
      return () => window.cancelAnimationFrame(id)
    }
    return undefined
  }, [startIndex, scrollToIndex])

  // Track scroll to update selectedIndex when user scrolls externally.
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const offset = axis === "x" ? viewport.scrollLeft : viewport.scrollTop
        const { slides, viewportSize } = measure()
        if (slides.length === 0) return
        const idx = findIndexForOffset(
          slides,
          offset,
          axis,
          align,
          viewportSize,
        )
        setSelectedIndex((prev) => {
          if (prev !== idx) {
            fire("select")
            return idx
          }
          return prev
        })
      })
    }
    viewport.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      viewport.removeEventListener("scroll", onScroll)
    }
  }, [axis, align, fire, measure])

  // Pointer drag.
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    let pointerId: number | null = null
    let startCoord = 0
    let startScroll = 0
    let lastDelta = 0

    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      pointerId = event.pointerId
      startCoord = axis === "x" ? event.clientX : event.clientY
      startScroll = axis === "x" ? viewport.scrollLeft : viewport.scrollTop
      lastDelta = 0
      viewport.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      const coord = axis === "x" ? event.clientX : event.clientY
      const delta = startCoord - coord
      lastDelta = delta
      if (axis === "x") viewport.scrollLeft = startScroll + delta
      else viewport.scrollTop = startScroll + delta
    }
    const up = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return
      pointerId = null
      try {
        viewport.releasePointerCapture(event.pointerId)
      } catch {
        // ignore
      }
      if (dragFree) return
      if (Math.abs(lastDelta) < DRAG_THRESHOLD_PX) {
        scrollToIndex(selectedIndex)
        return
      }
      if (lastDelta > 0) scrollNext()
      else scrollPrev()
    }
    viewport.addEventListener("pointerdown", down)
    viewport.addEventListener("pointermove", move)
    viewport.addEventListener("pointerup", up)
    viewport.addEventListener("pointercancel", up)
    return () => {
      viewport.removeEventListener("pointerdown", down)
      viewport.removeEventListener("pointermove", move)
      viewport.removeEventListener("pointerup", up)
      viewport.removeEventListener("pointercancel", up)
    }
  }, [axis, dragFree, scrollNext, scrollPrev, scrollToIndex, selectedIndex])

  // Autoplay
  React.useEffect(() => {
    if (!autoplay) return
    if (autoplay.pauseOnHover && hovered) return
    if (slideCount <= 1) return
    const id = window.setInterval(() => {
      scrollNext()
    }, autoplay.delay)
    return () => window.clearInterval(id)
  }, [autoplay, hovered, scrollNext, slideCount])

  const canScrollPrev = loop ? slideCount > 1 : selectedIndex > 0
  const canScrollNext = loop ? slideCount > 1 : selectedIndex < slideCount - 1

  const api = React.useMemo<CarouselApi>(
    () => ({
      scrollPrev,
      scrollNext,
      scrollTo: (idx: number) => scrollToIndex(idx),
      canScrollPrev: () => canScrollPrev,
      canScrollNext: () => canScrollNext,
      selectedScrollSnap: () => selectedIndex,
      on: (event, handler) => {
        listenersRef.current[event].add(handler)
      },
      off: (event, handler) => {
        listenersRef.current[event].delete(handler)
      },
    }),
    [
      scrollPrev,
      scrollNext,
      scrollToIndex,
      canScrollPrev,
      canScrollNext,
      selectedIndex,
    ],
  )

  const registerHover = useEvent((next: boolean) => setHovered(next))

  return {
    viewportRef,
    contentRef,
    selectedIndex,
    canScrollPrev,
    canScrollNext,
    orientation,
    scrollPrev,
    scrollNext,
    scrollTo: scrollToIndex,
    api,
    registerHover,
  }
}

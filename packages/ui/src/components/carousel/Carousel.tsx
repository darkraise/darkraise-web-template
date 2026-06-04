import * as React from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { cn } from "@lib/utils"
import { Button } from "@components/button"
import {
  useCarousel,
  type CarouselApi,
  type CarouselAlign,
  type CarouselOrientation,
  type UseCarouselReturn,
} from "./useCarousel"
import "./carousel.css"

export type { CarouselApi, CarouselAlign, CarouselOrientation }

interface CarouselOptions {
  align?: CarouselAlign
  loop?: boolean
  dragFree?: boolean
  startIndex?: number
}

interface CarouselProps {
  opts?: CarouselOptions
  /** legacy slot from embla — accepted but unused. */
  plugins?: unknown
  orientation?: CarouselOrientation
  setApi?: (api: CarouselApi) => void
  autoplay?: { delay: number; pauseOnHover?: boolean }
}

type CarouselContextValue = UseCarouselReturn

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarouselContext(): CarouselContextValue {
  const ctx = React.useContext(CarouselContext)
  if (!ctx) throw new Error("useCarousel must be used within a <Carousel />")
  return ctx
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  autoplay,
  className,
  children,
  ref,
  onMouseEnter,
  onMouseLeave,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  CarouselProps & {
    ref?: React.Ref<HTMLDivElement>
  }) {
  const carousel = useCarousel({
    orientation,
    align: opts?.align,
    loop: opts?.loop,
    dragFree: opts?.dragFree,
    startIndex: opts?.startIndex,
    autoplay,
  })

  React.useEffect(() => {
    setApi?.(carousel.api)
  }, [setApi, carousel.api])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isHorizontal = orientation === "horizontal"
    const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp"
    const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown"
    if (event.key === prevKey) {
      event.preventDefault()
      carousel.scrollPrev()
    } else if (event.key === nextKey) {
      event.preventDefault()
      carousel.scrollNext()
    }
  }

  return (
    <CarouselContext.Provider value={carousel}>
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        onMouseEnter={(event) => {
          carousel.registerHover(true)
          onMouseEnter?.(event)
        }}
        onMouseLeave={(event) => {
          carousel.registerHover(false)
          onMouseLeave?.(event)
        }}
        className={cn("dr-carousel", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({
  className,
  ref,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  const { orientation, viewportRef, contentRef } = useCarouselContext()
  const horizontal = orientation === "horizontal"
  const setContentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref)
        (ref as React.RefObject<HTMLDivElement | null>).current = node
    },
    [contentRef, ref],
  )

  return (
    <div
      ref={viewportRef}
      data-orientation={orientation}
      className="dr-carousel-content-wrapper"
      style={{
        overflow: "hidden",
        touchAction: horizontal ? "pan-y" : "pan-x",
      }}
    >
      <div
        ref={setContentRef}
        data-orientation={orientation}
        className={cn("dr-carousel-content", className)}
        style={{
          display: "flex",
          flexDirection: horizontal ? "row" : "column",
          ...style,
        }}
        {...props}
      />
    </div>
  )
}

function CarouselItem({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { ref?: React.Ref<HTMLDivElement> }) {
  const ctx = useCarouselContext()

  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      data-orientation={ctx.orientation}
      className={cn("dr-carousel-item", className)}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ref,
  ...props
}: React.ComponentProps<typeof Button>) {
  const ctx = useCarouselContext()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      data-orientation={ctx.orientation}
      className={cn("dr-carousel-previous", className)}
      disabled={!ctx.canScrollPrev}
      onClick={ctx.scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ref,
  ...props
}: React.ComponentProps<typeof Button>) {
  const ctx = useCarouselContext()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      data-orientation={ctx.orientation}
      className={cn("dr-carousel-next", className)}
      disabled={!ctx.canScrollNext}
      onClick={ctx.scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

function CarouselIndicatorGroup({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>
}) {
  const ctx = useCarouselContext()

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Carousel pagination"
      data-orientation={ctx.orientation}
      className={cn("dr-carousel-indicator-group", className)}
      {...props}
    />
  )
}

interface CarouselIndicatorProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  index: number
  readOnly?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

function CarouselIndicator({
  className,
  index,
  readOnly,
  ref,
  onClick,
  "aria-label": ariaLabel,
  ...props
}: CarouselIndicatorProps) {
  const ctx = useCarouselContext()
  const isCurrent = ctx.selectedIndex === index

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel ?? `Go to slide ${index + 1}`}
      aria-current={isCurrent ? "true" : undefined}
      data-current={isCurrent ? "true" : undefined}
      data-readonly={readOnly ? "true" : undefined}
      data-orientation={ctx.orientation}
      tabIndex={readOnly ? -1 : 0}
      className={cn("dr-carousel-indicator", className)}
      onClick={(event) => {
        if (!readOnly) ctx.scrollTo(index)
        onClick?.(event)
      }}
      {...props}
    />
  )
}

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselIndicatorGroup,
  CarouselIndicator,
}
export type { CarouselIndicatorProps }

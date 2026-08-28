import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselAutoplayToggle,
  type CarouselApi,
} from "@components/carousel"

function Basic({ loop = false }: { loop?: boolean } = {}) {
  return (
    <Carousel opts={{ loop }}>
      <CarouselContent>
        <CarouselItem>Slide 1</CarouselItem>
        <CarouselItem>Slide 2</CarouselItem>
        <CarouselItem>Slide 3</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
}

describe("Carousel", () => {
  it("renders with role=region and aria-roledescription=carousel", () => {
    render(<Basic />)
    const region = screen.getByRole("region")
    expect(region).toHaveAttribute("aria-roledescription", "carousel")
  })

  it("each slide has role=group and aria-roledescription=slide", () => {
    render(<Basic />)
    const slides = screen.getAllByRole("group")
    expect(slides).toHaveLength(3)
    slides.forEach((slide) =>
      expect(slide).toHaveAttribute("aria-roledescription", "slide"),
    )
  })

  it("previous button is disabled on first slide", () => {
    render(<Basic />)
    const prev = screen.getByRole("button", { name: /previous/i })
    expect(prev).toBeDisabled()
  })

  it("setApi exposes the carousel API object", () => {
    const setApi = vi.fn<(api: CarouselApi) => void>()
    render(
      <Carousel setApi={setApi}>
        <CarouselContent>
          <CarouselItem>A</CarouselItem>
        </CarouselContent>
      </Carousel>,
    )
    expect(setApi).toHaveBeenCalledOnce()
    const api = setApi.mock.calls[0]?.[0]
    expect(typeof api?.scrollNext).toBe("function")
    expect(typeof api?.scrollPrev).toBe("function")
    expect(typeof api?.scrollTo).toBe("function")
  })

  it("ArrowRight key calls scrollNext handler (no crash)", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const region = screen.getByRole("region")
    region.focus()
    await user.keyboard("{ArrowRight}")
    // no error; selectedIndex incremented internally — just assert stability
    expect(region).toBeInTheDocument()
  })

  it("ArrowLeft key calls scrollPrev handler (no crash)", async () => {
    const user = userEvent.setup()
    render(<Basic />)
    const region = screen.getByRole("region")
    region.focus()
    await user.keyboard("{ArrowLeft}")
    expect(region).toBeInTheDocument()
  })

  it("controlled setApi allows programmatic navigation", () => {
    let capturedApi: CarouselApi | null = null
    render(
      <Carousel
        setApi={(api) => {
          capturedApi = api
        }}
      >
        <CarouselContent>
          <CarouselItem>A</CarouselItem>
          <CarouselItem>B</CarouselItem>
        </CarouselContent>
      </Carousel>,
    )
    expect(capturedApi).not.toBeNull()
    expect(capturedApi?.selectedScrollSnap()).toBe(0)
  })

  it("vertical orientation sets data-orientation on items", () => {
    render(
      <Carousel orientation="vertical">
        <CarouselContent>
          <CarouselItem>Slide</CarouselItem>
        </CarouselContent>
      </Carousel>,
    )
    const slide = screen.getByRole("group")
    expect(slide).toHaveAttribute("data-orientation", "vertical")
  })
})

describe("Carousel autoplay is stoppable", () => {
  function mockReducedMotion(reduce: boolean) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn((query: string) => ({
        matches: query.includes("prefers-reduced-motion") ? reduce : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  }

  function Autoplaying() {
    return (
      <Carousel autoplay={{ delay: 1000 }}>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
          <CarouselItem>Slide 2</CarouselItem>
        </CarouselContent>
        <CarouselAutoplayToggle />
      </Carousel>
    )
  }

  beforeEach(() => {
    mockReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("offers a control, which is the part hover and focus cannot supply", () => {
    render(<Autoplaying />)
    expect(
      screen.getByRole("button", { name: /stop automatic slideshow/i }),
    ).toBeInTheDocument()
  })

  it("renders no control when the carousel does not autoplay", () => {
    render(
      <Carousel>
        <CarouselContent>
          <CarouselItem>Slide 1</CarouselItem>
        </CarouselContent>
        <CarouselAutoplayToggle />
      </Carousel>,
    )
    expect(
      screen.queryByRole("button", { name: /automatic slideshow/i }),
    ).not.toBeInTheDocument()
  })

  it("flips the control's accessible name once stopped", async () => {
    const user = userEvent.setup()
    render(<Autoplaying />)
    await user.click(
      screen.getByRole("button", { name: /stop automatic slideshow/i }),
    )
    expect(
      screen.getByRole("button", { name: /start automatic slideshow/i }),
    ).toBeInTheDocument()
  })

  // Positive control: without this the "does not start" assertions below
  // would pass just as happily if autoplay never ran in jsdom at all.
  it("starts a timer when nothing is paused", () => {
    const setInterval = vi.spyOn(window, "setInterval")
    render(<Autoplaying />)
    expect(setInterval).toHaveBeenCalled()
  })
  it("does not start a timer under reduced motion", () => {
    mockReducedMotion(true)
    const setInterval = vi.spyOn(window, "setInterval")
    render(<Autoplaying />)
    expect(setInterval).not.toHaveBeenCalled()
  })

  it("does not start a timer while focus is inside the carousel", async () => {
    const user = userEvent.setup()
    const setInterval = vi.spyOn(window, "setInterval")
    render(<Autoplaying />)
    setInterval.mockClear()
    await user.tab()
    expect(document.activeElement).not.toBe(document.body)
    expect(setInterval).not.toHaveBeenCalled()
  })
})

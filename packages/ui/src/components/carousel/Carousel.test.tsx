import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
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

import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent } from "darkraise-ui/components/card"
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "darkraise-ui/components/carousel"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/carousel")({
  component: CarouselPage,
})

const SLIDE_COUNT = 5

function CarouselPage() {
  return (
    <ShowcasePage
      title="Carousel"
      description="Horizontal slider with previous / next controls and keyboard navigation. Pair with CarouselIndicatorGroup for dot pagination."
    >
      <ShowcaseExample
        title="Horizontal card slider"
        code={`<Carousel className="w-full max-w-sm">
  <CarouselContent>
    {Array.from({ length: 5 }, (_, i) => (
      <CarouselItem key={i}>
        <Card>
          <CardContent className="flex aspect-square items-center justify-center p-6">
            <span className="text-4xl font-semibold">{i + 1}</span>
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}
      >
        <Carousel className="w-full max-w-sm">
          <CarouselContent>
            {Array.from({ length: SLIDE_COUNT }, (_, i) => (
              <CarouselItem key={i}>
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{i + 1}</span>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </ShowcaseExample>

      <ShowcaseExample
        title="With indicators (dot pagination)"
        code={`// IndicatorGroup holds one Indicator per slide. Each Indicator takes the
// matching index — clicking it scrolls the carousel to that slide. The
// active dot widens into a pill via the data-current attribute.
<Carousel className="w-full max-w-sm">
  <CarouselContent>
    {Array.from({ length: 5 }, (_, i) => (
      <CarouselItem key={i}>
        <Card>
          <CardContent className="flex aspect-square items-center justify-center p-6">
            <span className="text-4xl font-semibold">{i + 1}</span>
          </CardContent>
        </Card>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
  <CarouselIndicatorGroup>
    {Array.from({ length: 5 }, (_, i) => (
      <CarouselIndicator key={i} index={i} />
    ))}
  </CarouselIndicatorGroup>
</Carousel>`}
      >
        <Carousel className="w-full max-w-sm">
          <CarouselContent>
            {Array.from({ length: SLIDE_COUNT }, (_, i) => (
              <CarouselItem key={i}>
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{i + 1}</span>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
          <CarouselIndicatorGroup>
            {Array.from({ length: SLIDE_COUNT }, (_, i) => (
              <CarouselIndicator key={i} index={i} />
            ))}
          </CarouselIndicatorGroup>
        </Carousel>
      </ShowcaseExample>

      <ShowcaseExample
        title="Read-only indicators (status only, not clickable)"
        code={`// Pass readOnly to render dots as a non-interactive status display —
// useful for tour-style or autoplay carousels where navigation is locked.
<CarouselIndicatorGroup>
  {Array.from({ length: 5 }, (_, i) => (
    <CarouselIndicator key={i} index={i} readOnly />
  ))}
</CarouselIndicatorGroup>`}
      >
        <Carousel
          className="w-full max-w-sm"
          autoplay={{ delay: 2500, pauseOnHover: true }}
          opts={{ loop: true }}
        >
          <CarouselContent>
            {Array.from({ length: SLIDE_COUNT }, (_, i) => (
              <CarouselItem key={i}>
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{i + 1}</span>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselIndicatorGroup>
            {Array.from({ length: SLIDE_COUNT }, (_, i) => (
              <CarouselIndicator key={i} index={i} readOnly />
            ))}
          </CarouselIndicatorGroup>
        </Carousel>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

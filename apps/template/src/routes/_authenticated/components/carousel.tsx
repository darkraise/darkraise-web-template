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
  type CarouselAlign,
  type CarouselOrientation,
} from "darkraise-ui/components/carousel"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/carousel")({
  component: CarouselPage,
})

const SLIDE_COUNT = 5
const ALIGN_SLIDE_COUNT = 6

const CAROUSEL_ALIGNS = allOf<CarouselAlign>()("start", "center", "end")
const CAROUSEL_ORIENTATIONS = allOf<CarouselOrientation>()(
  "horizontal",
  "vertical",
)

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

      <ShowcaseExample
        title="Align"
        code={`// One representative cell: every align value renders above. Items are
// narrower than the viewport and startIndex begins mid-track, so the
// snap position of the active card visibly differs by align.
<Carousel opts={{ align: "center", startIndex: 2 }} className="w-full max-w-sm">
  <CarouselContent>
    {Array.from({ length: 6 }, (_, i) => (
      <CarouselItem key={i} className="basis-2/5">
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
        <VariantMatrix
          rows={{ label: "align", values: CAROUSEL_ALIGNS }}
          render={(align) => (
            <Carousel
              opts={{ align, startIndex: 2 }}
              className="w-full max-w-sm"
            >
              <CarouselContent>
                {Array.from({ length: ALIGN_SLIDE_COUNT }, (_, i) => (
                  <CarouselItem key={i} className="basis-2/5">
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
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Orientation"
        code={`// One representative cell: both orientations render above. Vertical
// needs an explicit height on the wrapper and on CarouselContent, or
// the column layout collapses to zero height.
<div className="h-64">
  <Carousel orientation="vertical">
    <CarouselContent className="h-64">
      {Array.from({ length: 5 }, (_, i) => (
        <CarouselItem key={i}>
          <Card>
            <CardContent className="flex h-20 items-center justify-center p-6">
              <span className="text-2xl font-semibold">{i + 1}</span>
            </CardContent>
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
</div>`}
      >
        <VariantMatrix
          rows={{ label: "orientation", values: CAROUSEL_ORIENTATIONS }}
          render={(orientation) =>
            orientation === "vertical" ? (
              <div className="h-64">
                <Carousel orientation="vertical">
                  <CarouselContent className="h-64">
                    {Array.from({ length: SLIDE_COUNT }, (_, i) => (
                      <CarouselItem key={i}>
                        <Card>
                          <CardContent className="flex h-20 items-center justify-center p-6">
                            <span className="text-2xl font-semibold">
                              {i + 1}
                            </span>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            ) : (
              <Carousel className="w-full max-w-sm">
                <CarouselContent>
                  {Array.from({ length: SLIDE_COUNT }, (_, i) => (
                    <CarouselItem key={i}>
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <span className="text-4xl font-semibold">
                            {i + 1}
                          </span>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )
          }
        />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

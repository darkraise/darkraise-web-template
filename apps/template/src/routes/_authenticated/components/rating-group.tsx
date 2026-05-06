import { createFileRoute } from "@tanstack/react-router"
import {
  RatingGroup,
  RatingGroupControl,
  RatingGroupLabel,
} from "darkraise-ui/components/rating-group"
import { cn } from "darkraise-ui/lib"
import { Heart, Star } from "lucide-react"
import { useState } from "react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/rating-group")(
  {
    component: RatingGroupPage,
  },
)

function RatingGroupPage() {
  const [basic, setBasic] = useState(3)
  const [half, setHalf] = useState(2.5)
  const [love, setLove] = useState(2)

  return (
    <ShowcasePage
      title="Rating Group"
      description="Star rating control with hover preview, optional half-star precision, and full keyboard support. Modeled as an ARIA radio group."
    >
      <ShowcaseExample
        title="Basic 5-star rating"
        code={`<RatingGroup
  max={5}
  value={basic}
  onValueChange={(d) => setBasic(d.value)}
>
  <RatingGroupLabel>How was your experience?</RatingGroupLabel>
  <RatingGroupControl
    renderItem={(state) => (
      <Star
        aria-hidden="true"
        className={cn(
          "size-5",
          state.highlighted
            ? "fill-warning text-warning"
            : "text-muted-foreground",
        )}
      />
    )}
  />
</RatingGroup>`}
      >
        <RatingGroup
          max={5}
          value={basic}
          onValueChange={(d) => setBasic(d.value)}
        >
          <RatingGroupLabel>How was your experience?</RatingGroupLabel>
          <RatingGroupControl
            renderItem={(state) => (
              <Star
                aria-hidden="true"
                className={cn(
                  "size-5",
                  state.highlighted
                    ? "fill-warning text-warning"
                    : "text-muted-foreground",
                )}
              />
            )}
          />
        </RatingGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="Half-star precision"
        code={`<RatingGroup
  max={5}
  allowHalf
  value={half}
  onValueChange={(d) => setHalf(d.value)}
>
  <RatingGroupLabel>Rate this product</RatingGroupLabel>
  <RatingGroupControl
    renderItem={(state) => (
      <span className="relative inline-flex">
        <Star aria-hidden="true" className="text-muted-foreground size-5" />
        {state.highlighted ? (
          <Star
            aria-hidden="true"
            className={cn(
              "fill-warning text-warning absolute inset-0 size-5",
              state.half ? "[clip-path:inset(0_50%_0_0)]" : "",
            )}
          />
        ) : null}
      </span>
    )}
  />
</RatingGroup>`}
      >
        <RatingGroup
          max={5}
          allowHalf
          value={half}
          onValueChange={(d) => setHalf(d.value)}
        >
          <RatingGroupLabel>Rate this product</RatingGroupLabel>
          <RatingGroupControl
            renderItem={(state) => (
              <span className="relative inline-flex">
                <Star
                  aria-hidden="true"
                  className="text-muted-foreground size-5"
                />
                {state.highlighted ? (
                  <Star
                    aria-hidden="true"
                    className={cn(
                      "fill-warning text-warning absolute inset-0 size-5",
                      state.half ? "[clip-path:inset(0_50%_0_0)]" : "",
                    )}
                  />
                ) : null}
              </span>
            )}
          />
        </RatingGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="Read-only display"
        code={`<RatingGroup max={5} defaultValue={4} readOnly allowHalf>
  <RatingGroupLabel>Average rating</RatingGroupLabel>
  <RatingGroupControl
    renderItem={(state) => (
      <Star
        aria-hidden="true"
        className={cn(
          "size-5",
          state.highlighted
            ? "fill-warning text-warning"
            : "text-muted-foreground",
        )}
      />
    )}
  />
</RatingGroup>`}
      >
        <RatingGroup max={5} defaultValue={4} readOnly allowHalf>
          <RatingGroupLabel>Average rating</RatingGroupLabel>
          <RatingGroupControl
            renderItem={(state) => (
              <Star
                aria-hidden="true"
                className={cn(
                  "size-5",
                  state.highlighted
                    ? "fill-warning text-warning"
                    : "text-muted-foreground",
                )}
              />
            )}
          />
        </RatingGroup>
      </ShowcaseExample>

      <ShowcaseExample
        title="Custom icon"
        code={`<RatingGroup
  max={5}
  value={love}
  onValueChange={(d) => setLove(d.value)}
>
  <RatingGroupLabel>How much do you love it?</RatingGroupLabel>
  <RatingGroupControl
    renderItem={(state) => (
      <Heart
        aria-hidden="true"
        className={cn(
          "size-5",
          state.highlighted
            ? "fill-destructive text-destructive"
            : "text-muted-foreground",
        )}
      />
    )}
  />
</RatingGroup>`}
      >
        <RatingGroup
          max={5}
          value={love}
          onValueChange={(d) => setLove(d.value)}
        >
          <RatingGroupLabel>How much do you love it?</RatingGroupLabel>
          <RatingGroupControl
            renderItem={(state) => (
              <Heart
                aria-hidden="true"
                className={cn(
                  "size-5",
                  state.highlighted
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground",
                )}
              />
            )}
          />
        </RatingGroup>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

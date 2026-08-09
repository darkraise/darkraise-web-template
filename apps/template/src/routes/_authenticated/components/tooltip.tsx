import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "darkraise-ui/components/tooltip"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/tooltip")({
  component: TooltipPage,
})

const TOOLTIP_SIDES = allOf<"top" | "right" | "bottom" | "left">()(
  "top",
  "right",
  "bottom",
  "left",
)

const TOOLTIP_ALIGNS = allOf<"start" | "center" | "end">()(
  "start",
  "center",
  "end",
)

function TooltipPage() {
  return (
    <ShowcasePage
      title="Tooltip"
      description="Short hover/focus label. Mount a single TooltipProvider at the page or app root, then wrap each trigger in a Tooltip."
    >
      <ShowcaseExample
        title="Basic"
        code={`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>This is a tooltip</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a tooltip</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ShowcaseExample>

      <ShowcaseExample
        title="Side x align"
        code={`// One representative cell: every side x align combination renders above.
// Each cell is a live Tooltip; hover or focus its trigger to see that placement.
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline" size="sm">right/end</Button>
  </TooltipTrigger>
  <TooltipContent side="right" align="end">side=right align=end</TooltipContent>
</Tooltip>`}
      >
        <TooltipProvider>
          <VariantMatrix
            rows={{ label: "side", values: TOOLTIP_SIDES }}
            cols={{ label: "align", values: TOOLTIP_ALIGNS }}
            render={(side, align) => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    {side}/{align}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={side} align={align}>
                  side={side} align={align}
                </TooltipContent>
              </Tooltip>
            )}
          />
        </TooltipProvider>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

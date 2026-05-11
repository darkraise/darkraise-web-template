import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "darkraise-ui/components/tooltip"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/tooltip")({
  component: TooltipPage,
})

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
        title="Sides"
        code={`<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">?</Button>
  </TooltipTrigger>
  <TooltipContent side="right">
    <p>Help information on the right</p>
  </TooltipContent>
</Tooltip>

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="destructive" size="sm">Danger</Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">
    <p>This action is irreversible</p>
  </TooltipContent>
</Tooltip>`}
      >
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  ?
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Help information on the right</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="sm">
                  Danger
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>This action is irreversible</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm">
                  Top
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Tooltip above</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

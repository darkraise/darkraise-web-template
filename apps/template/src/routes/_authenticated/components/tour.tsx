import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import { Tour, type TourStep } from "darkraise-ui/components/tour"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/tour")({
  component: TourPage,
})

const STEPS: TourStep[] = [
  {
    targetSelector: "[data-tour='step-1']",
    title: "Welcome",
    description:
      "This is the first stop. The spotlight cuts a hole through the backdrop around it.",
  },
  {
    targetSelector: "[data-tour='step-2']",
    title: "Save your work",
    description:
      "The spotlight follows resize and scroll, so it stays anchored as you move through the page.",
  },
  {
    targetSelector: "[data-tour='step-3']",
    title: "All set",
    description: "Press Done to dismiss, or click outside the popover to skip.",
  },
]

function TourPage() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)

  const startTour = () => {
    setCurrent(0)
    setOpen(true)
  }

  return (
    <ShowcasePage
      title="Tour"
      description="A guided walkthrough that highlights elements with a spotlight and shows a step popover. Targets are matched by CSS selector so the host page does not need refs."
    >
      <ShowcaseExample
        title="Triggered tour"
        code={`const [open, setOpen] = useState(false)
const [current, setCurrent] = useState(0)

<Button onClick={() => setOpen(true)}>Start tour</Button>
<Button data-tour="step-1">Step 1 target</Button>
<Button data-tour="step-2">Step 2 target</Button>
<Button data-tour="step-3">Step 3 target</Button>

<Tour
  open={open}
  steps={STEPS}
  current={current}
  onChange={setCurrent}
  onClose={() => setOpen(false)}
/>`}
      >
        <div className="space-y-4">
          <Button onClick={startTour}>Start tour</Button>
          <div className="flex flex-wrap gap-3">
            <Button data-tour="step-1" variant="outline">
              Inbox
            </Button>
            <Button data-tour="step-2" variant="outline">
              Save
            </Button>
            <Button data-tour="step-3" variant="outline">
              Settings
            </Button>
          </div>
          <Tour
            open={open}
            steps={STEPS}
            current={current}
            onChange={setCurrent}
            onClose={() => setOpen(false)}
          />
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

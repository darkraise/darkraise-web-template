import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Info, CircleCheck, TriangleAlert, OctagonX, X } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "darkraise-ui/components/alert"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/alert")({
  component: AlertPage,
})

type AlertBannerVariant = "info" | "success" | "warning" | "destructive"

const alertIconByVariant: Record<AlertBannerVariant, React.ElementType> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: OctagonX,
}

function AlertBanner({
  variant,
  title,
  description,
}: {
  variant: AlertBannerVariant
  title: string
  description: string
}) {
  const Icon = alertIconByVariant[variant]
  return (
    <Alert variant={variant}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

function DismissibleAlert() {
  const [visible, setVisible] = useState(true)

  if (!visible) {
    return (
      <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
        Show alert again
      </Button>
    )
  }

  return (
    <Alert variant="info" className="pr-10">
      <Info className="h-4 w-4" />
      <AlertTitle>New feature available</AlertTitle>
      <AlertDescription>
        You can now export your data as CSV from the settings page.
      </AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible(false)}
        className="absolute top-1 right-1 shrink-0"
        aria-label="Dismiss"
      >
        <X />
      </Button>
    </Alert>
  )
}

function AlertPage() {
  return (
    <ShowcasePage
      title="Alert"
      description="Inline status banner with a leading icon, title, and description. Use for page-level notices, validation summaries, or status callouts."
    >
      <ShowcaseExample
        title="Variants"
        code={`// Variants: "default" | "destructive" | "success" | "warning" | "info".
// Each tinted variant paints a left-accent border, low-alpha background,
// and a coloured icon + title; the description stays on text-foreground.

<Alert variant="info">
  <Info className="h-4 w-4" />
  <AlertTitle>Scheduled maintenance</AlertTitle>
  <AlertDescription>The system will be unavailable on Sunday from 2–4 AM UTC.</AlertDescription>
</Alert>`}
      >
        <div className="space-y-3">
          <AlertBanner
            variant="info"
            title="Scheduled maintenance"
            description="The system will be unavailable on Sunday from 2–4 AM UTC."
          />
          <AlertBanner
            variant="success"
            title="Deployment successful"
            description="Version 2.4.1 is now live in production."
          />
          <AlertBanner
            variant="warning"
            title="API rate limit approaching"
            description="You have used 90% of your monthly API quota."
          />
          <AlertBanner
            variant="destructive"
            title="Payment failed"
            description="Your last invoice could not be processed. Please update your billing details."
          />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Dismissible"
        code={`const [visible, setVisible] = useState(true)

{visible ? (
  // Alert is position:relative; absolute-positioning the close button at
  // top-right keeps it aligned with the title row. pr-10 reserves space
  // so long descriptions don't run under the button.
  <Alert variant="info" className="pr-10">
    <Info className="h-4 w-4" />
    <AlertTitle>New feature available</AlertTitle>
    <AlertDescription>
      You can now export your data as CSV from the settings page.
    </AlertDescription>
    <Button variant="ghost" size="icon" className="absolute top-1 right-1" onClick={() => setVisible(false)}>
      <X />
    </Button>
  </Alert>
) : (
  <Button onClick={() => setVisible(true)}>Show alert again</Button>
)}`}
      >
        <DismissibleAlert />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

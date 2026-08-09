import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Info, CircleCheck, TriangleAlert, OctagonX, X } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "darkraise-ui/components/alert"
import type { AlertVariant } from "darkraise-ui/components/alert"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/alert")({
  component: AlertPage,
})

const ALERT_VARIANTS = allOf<AlertVariant>()(
  "default",
  "destructive",
  "success",
  "warning",
  "info",
)

const alertIconByVariant: Record<AlertVariant, React.ElementType> = {
  default: Info,
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
  variant: AlertVariant
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
        code={`// One representative cell: every variant renders above.
<Alert variant="warning">
  <TriangleAlert className="h-4 w-4" />
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>This is an example alert message.</AlertDescription>
</Alert>`}
      >
        <VariantMatrix
          rows={{ label: "variant", values: ALERT_VARIANTS }}
          render={(variant) => (
            <AlertBanner
              variant={variant}
              title="Heads up"
              description="This is an example alert message."
            />
          )}
        />
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

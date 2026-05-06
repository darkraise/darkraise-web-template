import { useState, useEffect, useRef } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { Info, CircleCheck, TriangleAlert, OctagonX, X } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import { Card, CardContent } from "darkraise-ui/components/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "darkraise-ui/components/alert"
import { Progress } from "darkraise-ui/components/progress"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/feedback")({
  component: FeedbackPage,
})

type AlertVariant = "info" | "success" | "warning" | "error"

const alertConfig: Record<
  AlertVariant,
  { icon: React.ElementType; className: string }
> = {
  info: {
    icon: Info,
    className: "border-l-4 border-l-primary bg-primary/5",
  },
  success: {
    icon: CircleCheck,
    className: "border-l-4 border-l-success bg-success/5",
  },
  warning: {
    icon: TriangleAlert,
    className: "border-l-4 border-l-warning bg-warning/5",
  },
  error: {
    icon: OctagonX,
    className: "border-l-4 border-l-destructive bg-destructive/5",
  },
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
  const { icon: Icon, className } = alertConfig[variant]
  return (
    <Alert className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

function DismissibleAlert() {
  const [visible, setVisible] = useState(true)
  const { icon: Icon, className } = alertConfig.info

  if (!visible) {
    return (
      <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
        Show alert again
      </Button>
    )
  }

  return (
    <Alert className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>New feature available</AlertTitle>
      <AlertDescription className="flex items-start justify-between gap-2">
        <span>You can now export your data as CSV from the settings page.</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setVisible(false)}
          className="mt-0.5 h-6 w-6 shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}

function ProgressDemo() {
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    if (running) return
    setProgress(0)
    setRunning(true)
  }

  useEffect(() => {
    if (!running) return

    const id = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 15) + 5
        if (next >= 100) {
          clearInterval(id)
          setRunning(false)
          return 100
        }
        return next
      })
    }, 300)
    intervalRef.current = id

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running])

  const label =
    progress === 100
      ? "Upload complete"
      : running
        ? "Uploading..."
        : "Ready to upload"

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <Button
          size="sm"
          onClick={start}
          disabled={running}
          variant={progress === 100 ? "outline" : "default"}
        >
          {progress === 100 ? "Upload again" : "Start upload"}
        </Button>
      </CardContent>
    </Card>
  )
}

function FeedbackPage() {
  return (
    <ShowcasePage
      title="Feedback"
      description="Toast notifications and inline alert patterns for communicating status to users."
    >
      <ShowcaseExample
        title="Toast variants"
        code={`toast.success("Changes saved successfully")
toast.error("Something went wrong")
toast.warning("Storage is almost full")
toast.info("A new version is available")`}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => toast.success("Changes saved successfully")}
          >
            Success
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.error("Something went wrong")}
          >
            Error
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.warning("Storage is almost full")}
          >
            Warning
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("A new version is available")}
          >
            Info
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Toast with action"
        code={`toast("Item deleted", {
  action: {
    label: "Undo",
    onClick: () => toast.success("Item restored"),
  },
})`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast("Item deleted", {
              action: {
                label: "Undo",
                onClick: () => toast.success("Item restored"),
              },
            })
          }
        >
          Delete item
        </Button>
      </ShowcaseExample>

      <ShowcaseExample
        title="Toast with description"
        code={`toast("Account updated", {
  description: "Your profile changes have been saved and will take effect immediately.",
})`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast("Account updated", {
              description:
                "Your profile changes have been saved and will take effect immediately.",
            })
          }
        >
          Update account
        </Button>
      </ShowcaseExample>

      <ShowcaseExample
        title="Promise toast"
        code={`toast.promise(
  new Promise((resolve) => setTimeout(resolve, 2000)),
  {
    loading: "Saving changes...",
    success: "Changes saved!",
    error: "Failed to save changes.",
  },
)`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast.promise(
              new Promise<void>((resolve) => setTimeout(resolve, 2000)),
              {
                loading: "Saving changes...",
                success: "Changes saved!",
                error: "Failed to save changes.",
              },
            )
          }
        >
          Save with promise
        </Button>
      </ShowcaseExample>

      <ShowcaseExample
        title="Toast with custom duration"
        code={`toast("Quick notice", { duration: 2000 })
toast("Standard notice", { duration: 4000 })
toast("Extended notice", { duration: 8000 })`}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              toast("Quick notice — disappears in 2s", { duration: 2000 })
            }
          >
            2 seconds
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast("Standard notice — disappears in 4s", { duration: 4000 })
            }
          >
            4 seconds
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast("Extended notice — disappears in 8s", { duration: 8000 })
            }
          >
            8 seconds
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Inline alert banner"
        code={`import { Alert, AlertTitle, AlertDescription } from "darkraise-ui/components/alert"

<Alert className="border-l-4 border-l-primary bg-primary/5">
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
            variant="error"
            title="Payment failed"
            description="Your last invoice could not be processed. Please update your billing details."
          />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Dismissible inline alert"
        code={`const [visible, setVisible] = useState(true)

{visible ? (
  <Alert className="border-l-4 border-l-primary bg-primary/5">
    <Info className="h-4 w-4" />
    <AlertTitle>New feature available</AlertTitle>
    <AlertDescription className="flex items-start justify-between gap-2">
      <span>You can now export your data as CSV from the settings page.</span>
      <Button variant="ghost" size="icon" className="mt-0.5 h-6 w-6 shrink-0" onClick={() => setVisible(false)}>
        <X className="h-4 w-4" />
      </Button>
    </AlertDescription>
  </Alert>
) : (
  <Button onClick={() => setVisible(true)}>Show alert again</Button>
)}`}
      >
        <DismissibleAlert />
      </ShowcaseExample>

      <ShowcaseExample
        title="Progress feedback"
        code={`import { Progress } from "darkraise-ui/components/progress"

const [progress, setProgress] = useState(0)
const [running, setRunning] = useState(false)

useEffect(() => {
  if (!running) return
  const id = setInterval(() => {
    setProgress((prev) => {
      const next = prev + Math.floor(Math.random() * 15) + 5
      if (next >= 100) { clearInterval(id); setRunning(false); return 100 }
      return next
    })
  }, 300)
  return () => clearInterval(id)
}, [running])

<Progress value={progress} className="h-2" />`}
      >
        <ProgressDemo />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

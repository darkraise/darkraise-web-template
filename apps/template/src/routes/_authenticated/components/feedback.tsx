import { useState, useEffect, useRef } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "darkraise-ui/components/sonner"
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
        title="Rich content (title + description + actions + close)"
        code={`// Every toast kind accepts a description, an action button, a cancel
// button, and an opt-in persistent close (×). Combine them for high-stakes
// notifications like deletions, deploy failures, or quota warnings.

toast.error("Deploy failed", {
  description: "Build #4271 exited with code 1 in the lint step.",
  action: { label: "Retry", onClick: () => deploy() },
  cancel: { label: "View log", onClick: () => openLog() },
  closeButton: true,
  duration: 12000,
})`}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Backup completed", {
                description:
                  "12.4 GB across 3,210 files were uploaded to cold storage.",
                action: {
                  label: "View report",
                  onClick: () => toast.info("Opening report…"),
                },
                closeButton: true,
                duration: 8000,
              })
            }
          >
            Success — rich
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.error("Deploy failed", {
                description: "Build #4271 exited with code 1 in the lint step.",
                action: {
                  label: "Retry",
                  onClick: () => toast.loading("Re-running build…"),
                },
                cancel: {
                  label: "View log",
                  onClick: () => toast.info("Opening build log…"),
                },
                closeButton: true,
                duration: 12000,
              })
            }
          >
            Error — rich
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.warning("Storage almost full", {
                description:
                  "You are using 92% of the 50 GB plan. Upgrade or remove old assets to avoid interruptions.",
                action: {
                  label: "Upgrade",
                  onClick: () => toast.info("Opening billing…"),
                },
                closeButton: true,
                duration: 10000,
              })
            }
          >
            Warning — rich
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.info("New version available", {
                description: "v2.4.0 includes the diff viewer and audit log.",
                action: {
                  label: "Reload",
                  onClick: () => toast.success("Reloading…"),
                },
                cancel: {
                  label: "Later",
                  onClick: () => {},
                },
                closeButton: true,
                duration: 10000,
              })
            }
          >
            Info — rich
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
        title="Toast with persistent close button"
        code={`toast("Important notice", { closeButton: true })

// or set a Toaster-wide default:
<Toaster closeButton />`}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              toast("Important notice with close button", {
                closeButton: true,
              })
            }
          >
            With close button
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Saved! (close button visible)", {
                closeButton: true,
                duration: 10000,
              })
            }
          >
            Long-lived success
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Toast position (per-toast or default)"
        code={`// Default position is set on the Toaster — usually mounted once at
// the app root. Each toast can override via options.position.

// Default for the whole app (defaults to "bottom-right" when omitted):
<Toaster position="bottom-right" />

// Per-message override:
toast.success("Saved", { position: "top-right" })
toast.error("Quota exceeded", { position: "top-left" })`}
      >
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() =>
              toast.info("Top-left toast", { position: "top-left" })
            }
          >
            Top-left
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Top-right toast", { position: "top-right" })
            }
          >
            Top-right
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.warning("Bottom-left toast", { position: "bottom-left" })
            }
          >
            Bottom-left
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.error("Bottom-right toast", { position: "bottom-right" })
            }
          >
            Bottom-right
          </Button>
        </div>
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

// Variants: "default" | "destructive" | "success" | "warning" | "info".
// Each tinted variant paints a left-accent border, low-alpha background,
// and a coloured icon + title; the description stays on text-foreground
// for readability.

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
        title="Dismissible inline alert"
        code={`const [visible, setVisible] = useState(true)

{visible ? (
  // Alert is position:relative; absolute-positioning the close button at
  // top-right keeps it aligned with the title row instead of falling to
  // the end of the description. pr-10 reserves space so long descriptions
  // don't run under the button.
  <Alert variant="info" className="pr-10">
    <Info className="h-4 w-4" />
    <AlertTitle>New feature available</AlertTitle>
    <AlertDescription>
      You can now export your data as CSV from the settings page.
    </AlertDescription>
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-1 right-1 shrink-0"
      aria-label="Dismiss"
      onClick={() => setVisible(false)}
    >
      <X />
    </Button>
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

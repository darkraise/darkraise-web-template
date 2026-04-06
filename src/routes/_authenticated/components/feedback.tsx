import { useState, useEffect, useRef } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { toast } from "sonner"
import { Info, CircleCheck, TriangleAlert, OctagonX, X } from "lucide-react"
import { PageHeader } from "@/core/layout"
import { Button } from "@/core/components/ui/button"
import { Card, CardContent } from "@/core/components/ui/card"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/feedback")({
  component: FeedbackPage,
})

type AlertVariant = "info" | "success" | "warning" | "error"

const alertConfig: Record<
  AlertVariant,
  { icon: React.ReactNode; borderColor: string; bg: string; titleColor: string }
> = {
  info: {
    icon: <Info className="h-4 w-4 text-blue-500" />,
    borderColor: "border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    titleColor: "text-blue-900 dark:text-blue-100",
  },
  success: {
    icon: <CircleCheck className="h-4 w-4 text-green-500" />,
    borderColor: "border-l-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    titleColor: "text-green-900 dark:text-green-100",
  },
  warning: {
    icon: <TriangleAlert className="h-4 w-4 text-amber-500" />,
    borderColor: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    titleColor: "text-amber-900 dark:text-amber-100",
  },
  error: {
    icon: <OctagonX className="h-4 w-4 text-red-500" />,
    borderColor: "border-l-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    titleColor: "text-red-900 dark:text-red-100",
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
  const config = alertConfig[variant]
  return (
    <div
      className={`flex gap-3 rounded-md border-l-4 p-4 ${config.borderColor} ${config.bg}`}
    >
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="space-y-1">
        <p className={`text-sm font-medium ${config.titleColor}`}>{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  )
}

function DismissibleAlert() {
  const [visible, setVisible] = useState(true)
  const config = alertConfig.info

  if (!visible) {
    return (
      <Button variant="outline" size="sm" onClick={() => setVisible(true)}>
        Show alert again
      </Button>
    )
  }

  return (
    <div
      className={`flex items-start gap-3 rounded-md border-l-4 p-4 ${config.borderColor} ${config.bg}`}
    >
      <div className="mt-0.5 shrink-0">{config.icon}</div>
      <div className="flex-1 space-y-1">
        <p className={`text-sm font-medium ${config.titleColor}`}>
          New feature available
        </p>
        <p className="text-muted-foreground text-sm">
          You can now export your data as CSV from the settings page.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 rounded p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
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
        <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
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
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Feedback" },
        ]}
        title="Feedback"
        description="Toast notifications and inline alert patterns for communicating status to users."
      />

      <div className="space-y-6">
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
          code={`function AlertBanner({ variant, title, description }) {
  // variant: "info" | "success" | "warning" | "error"
  return (
    <div className={\`flex gap-3 rounded-md border-l-4 p-4 \${borderColor} \${bg}\`}>
      <Icon className="h-4 w-4" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}`}
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
  <div className="flex items-start gap-3 rounded-md border-l-4 p-4 ...">
    <Icon />
    <div className="flex-1">
      <p className="text-sm font-medium">New feature available</p>
      <p className="text-sm text-muted-foreground">...</p>
    </div>
    <button onClick={() => setVisible(false)}>
      <X className="h-4 w-4" />
    </button>
  </div>
) : (
  <Button onClick={() => setVisible(true)}>Show alert again</Button>
)}`}
        >
          <DismissibleAlert />
        </ShowcaseExample>

        <ShowcaseExample
          title="Progress feedback"
          code={`const [progress, setProgress] = useState(0)
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

<div className="h-2 w-full rounded-full bg-muted">
  <div
    className="h-2 rounded-full bg-primary transition-all duration-300"
    style={{ width: \`\${progress}%\` }}
  />
</div>`}
        >
          <ProgressDemo />
        </ShowcaseExample>
      </div>
    </div>
  )
}

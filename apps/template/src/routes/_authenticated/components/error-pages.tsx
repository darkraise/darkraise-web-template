import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { FileQuestion, TriangleAlert, ServerCrash, Wrench } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import { ErrorLayout } from "@/core/errors"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/error-pages")({
  component: ErrorPagesShowcase,
})

function InlinePreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-lg border">{children}</div>
  )
}

function NotFoundPreview() {
  return (
    <InlinePreview>
      <ErrorLayout
        icon={<FileQuestion className="h-16 w-16" strokeWidth={1.5} />}
        code="404"
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
        className="min-h-[400px]"
      >
        <Button variant="outline" size="sm">
          Go back
        </Button>
        <Button size="sm">Back to home</Button>
      </ErrorLayout>
    </InlinePreview>
  )
}

function ErrorBoundaryPreview() {
  const [message, setMessage] = useState("An unexpected error occurred.")

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMessage("An unexpected error occurred.")}
        >
          Generic
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setMessage("Cannot read properties of undefined (reading 'id')")
          }
        >
          TypeError
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setMessage("Network request failed: ERR_CONNECTION_REFUSED")
          }
        >
          Network
        </Button>
      </div>
      <InlinePreview>
        <ErrorLayout
          icon={<TriangleAlert className="h-16 w-16" strokeWidth={1.5} />}
          title="Something went wrong"
          description={message}
          className="min-h-[400px]"
        >
          <Button variant="outline" size="sm">
            Try again
          </Button>
          <Button size="sm">Back to home</Button>
        </ErrorLayout>
      </InlinePreview>
    </div>
  )
}

function ServerErrorPreview() {
  return (
    <InlinePreview>
      <ErrorLayout
        icon={<ServerCrash className="h-16 w-16" strokeWidth={1.5} />}
        code="500"
        title="Server error"
        description="Something went wrong on our end. Please try again later."
        className="min-h-[400px]"
      >
        <Button variant="outline" size="sm">
          Retry
        </Button>
        <Button size="sm">Back to home</Button>
      </ErrorLayout>
    </InlinePreview>
  )
}

function MaintenancePreview() {
  return (
    <InlinePreview>
      <ErrorLayout
        icon={<Wrench className="h-16 w-16" strokeWidth={1.5} />}
        title="Under maintenance"
        description="We're performing scheduled maintenance. We'll be back shortly."
        className="min-h-[400px]"
      />
    </InlinePreview>
  )
}

function CustomErrorPreview() {
  return (
    <InlinePreview>
      <ErrorLayout
        icon={<TriangleAlert className="h-16 w-16" strokeWidth={1.5} />}
        code="403"
        title="Access denied"
        description="You don't have permission to view this page. Contact your administrator if you believe this is a mistake."
        className="min-h-[400px]"
      >
        <Button variant="outline" size="sm">
          Go back
        </Button>
        <Button size="sm">Request access</Button>
      </ErrorLayout>
    </InlinePreview>
  )
}

function ErrorPagesShowcase() {
  return (
    <ShowcasePage
      title="Error Pages"
      description="Full-screen error states for 404, 500, error boundaries, and maintenance mode. Built on a shared ErrorLayout component."
    >
      <ShowcaseExample
        title="404 — Not found"
        code={`import { NotFoundPage } from "@/core/errors"

// Wired automatically via TanStack Router:
// - createRouter({ defaultNotFoundComponent: NotFoundPage })
// - Root route: notFoundComponent: NotFoundPage

// Or use ErrorLayout directly:
<ErrorLayout
  icon={<FileQuestion className="h-16 w-16" strokeWidth={1.5} />}
  code="404"
  title="Page not found"
  description="The page you're looking for doesn't exist or has been moved."
>
  <Button variant="outline" onClick={() => router.history.back()}>
    Go back
  </Button>
  <Button onClick={() => router.navigate({ to: "/" })}>
    Back to home
  </Button>
</ErrorLayout>`}
      >
        <NotFoundPreview />
      </ShowcaseExample>

      <ShowcaseExample
        title="Error boundary"
        code={`import { ErrorPage } from "@/core/errors"

// Wired automatically via TanStack Router:
// - createRouter({ defaultErrorComponent: ErrorPage })

// ErrorPage receives { error, reset } from the router.
// It displays the error message and offers retry + home actions.

export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred."

  return (
    <ErrorLayout
      icon={<TriangleAlert className="h-16 w-16" strokeWidth={1.5} />}
      title="Something went wrong"
      description={message}
    >
      <Button variant="outline" onClick={() => { reset(); router.invalidate() }}>
        Try again
      </Button>
      <Button onClick={() => router.navigate({ to: "/" })}>
        Back to home
      </Button>
    </ErrorLayout>
  )
}`}
      >
        <ErrorBoundaryPreview />
      </ShowcaseExample>

      <ShowcaseExample
        title="500 — Server error"
        code={`import { ServerErrorPage } from "@/core/errors"

// Use in route loaders when the API returns a server error:
// loader: async () => {
//   const res = await fetch("/api/data")
//   if (res.status >= 500) throw new Error("Server error")
// }

<ErrorLayout
  icon={<ServerCrash className="h-16 w-16" strokeWidth={1.5} />}
  code="500"
  title="Server error"
  description="Something went wrong on our end. Please try again later."
>
  <Button variant="outline" onClick={() => router.invalidate()}>
    Retry
  </Button>
  <Button onClick={() => router.navigate({ to: "/" })}>
    Back to home
  </Button>
</ErrorLayout>`}
      >
        <ServerErrorPreview />
      </ShowcaseExample>

      <ShowcaseExample
        title="Maintenance"
        code={`import { MaintenancePage } from "@/core/errors"

// Render when a feature flag indicates maintenance mode:
// if (isMaintenanceMode) return <MaintenancePage />

<ErrorLayout
  icon={<Wrench className="h-16 w-16" strokeWidth={1.5} />}
  title="Under maintenance"
  description="We're performing scheduled maintenance. We'll be back shortly."
/>`}
      >
        <MaintenancePreview />
      </ShowcaseExample>

      <ShowcaseExample
        title="Custom error page"
        code={`// Use ErrorLayout to build any custom error page:
<ErrorLayout
  icon={<TriangleAlert className="h-16 w-16" strokeWidth={1.5} />}
  code="403"
  title="Access denied"
  description="You don't have permission to view this page."
>
  <Button variant="outline">Go back</Button>
  <Button>Request access</Button>
</ErrorLayout>`}
      >
        <CustomErrorPreview />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

import { useRouter } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/core/components/ui/button"
import { ErrorLayout } from "./error-layout"

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
      <Button
        variant="outline"
        onClick={() => {
          reset()
          router.invalidate()
        }}
      >
        Try again
      </Button>
      <Button onClick={() => router.navigate({ to: "/" })}>Back to home</Button>
    </ErrorLayout>
  )
}

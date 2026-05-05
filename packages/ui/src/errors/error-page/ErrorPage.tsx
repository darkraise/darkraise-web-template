import { TriangleAlert } from "lucide-react"
import { Button } from "../../components/button"
import { useRouterAdapter } from "../../router"
import { ErrorLayout } from "../error-layout"

export interface ErrorPageProps {
  error: unknown
  reset: () => void
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const { useNavigate, useInvalidate } = useRouterAdapter()
  const navigate = useNavigate()
  const invalidate = useInvalidate()
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
          invalidate()
        }}
      >
        Try again
      </Button>
      <Button onClick={() => navigate("/")}>Back to home</Button>
    </ErrorLayout>
  )
}

import { TriangleAlert } from "lucide-react"
import { Button } from "@components/button"
import { useOptionalRouterAdapter } from "@router"
import { ErrorLayout } from "@errors/error-layout"
import { useUiLabels } from "@labels"

export interface ErrorPageProps {
  error: unknown
  reset: () => void
}

export function ErrorPage({ error, reset }: ErrorPageProps) {
  const { useNavigate, useInvalidate } = useOptionalRouterAdapter()
  const navigate = useNavigate()
  const invalidate = useInvalidate()
  const labels = useUiLabels()
  const message =
    error instanceof Error ? error.message : labels.errors.genericDescription

  return (
    <ErrorLayout
      icon={
        <TriangleAlert
          className="size-[var(--icon-size-3xl)]"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      }
      title={labels.errors.genericTitle}
      description={message}
    >
      <Button
        variant="outline"
        onClick={() => {
          reset()
          invalidate()
        }}
      >
        {labels.errors.tryAgain}
      </Button>
      <Button onClick={() => navigate("/")}>{labels.errors.backHome}</Button>
    </ErrorLayout>
  )
}

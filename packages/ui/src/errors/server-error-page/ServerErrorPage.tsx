import { ServerCrash } from "lucide-react"
import { Button } from "@components/button"
import { useOptionalRouterAdapter } from "@router"
import { ErrorLayout } from "@errors/error-layout"
import { useUiLabels } from "@labels"

export function ServerErrorPage() {
  const { useNavigate, useInvalidate } = useOptionalRouterAdapter()
  const navigate = useNavigate()
  const invalidate = useInvalidate()
  const labels = useUiLabels()

  return (
    <ErrorLayout
      icon={
        <ServerCrash
          className="size-[var(--icon-size-3xl)]"
          strokeWidth={1.5}
        />
      }
      code="500"
      title={labels.errors.serverErrorTitle}
      description={labels.errors.serverErrorDescription}
    >
      <Button variant="outline" onClick={invalidate}>
        {labels.errors.retry}
      </Button>
      <Button onClick={() => navigate("/")}>{labels.errors.backHome}</Button>
    </ErrorLayout>
  )
}

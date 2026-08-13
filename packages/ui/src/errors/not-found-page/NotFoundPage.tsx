import { FileQuestion } from "lucide-react"
import { Button } from "@components/button"
import { useOptionalRouterAdapter } from "@router"
import { ErrorLayout } from "@errors/error-layout"
import { useUiLabels } from "@labels"

export function NotFoundPage() {
  const { useNavigate, useBack } = useOptionalRouterAdapter()
  const navigate = useNavigate()
  const back = useBack()
  const labels = useUiLabels()

  return (
    <ErrorLayout
      icon={
        <FileQuestion
          className="size-[var(--icon-size-3xl)]"
          strokeWidth={1.5}
        />
      }
      code="404"
      title={labels.errors.notFoundTitle}
      description={labels.errors.notFoundDescription}
    >
      <Button variant="outline" onClick={back}>
        {labels.errors.goBack}
      </Button>
      <Button onClick={() => navigate("/")}>{labels.errors.backHome}</Button>
    </ErrorLayout>
  )
}

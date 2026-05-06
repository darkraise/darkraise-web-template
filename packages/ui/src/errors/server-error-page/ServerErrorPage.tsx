import { ServerCrash } from "lucide-react"
import { Button } from "@components/button"
import { useRouterAdapter } from "@router"
import { ErrorLayout } from "@errors/error-layout"

export function ServerErrorPage() {
  const { useNavigate, useInvalidate } = useRouterAdapter()
  const navigate = useNavigate()
  const invalidate = useInvalidate()

  return (
    <ErrorLayout
      icon={<ServerCrash className="h-16 w-16" strokeWidth={1.5} />}
      code="500"
      title="Server error"
      description="Something went wrong on our end. Please try again later."
    >
      <Button variant="outline" onClick={invalidate}>
        Retry
      </Button>
      <Button onClick={() => navigate("/")}>Back to home</Button>
    </ErrorLayout>
  )
}

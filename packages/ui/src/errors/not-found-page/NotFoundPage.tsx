import { FileQuestion } from "lucide-react"
import { Button } from "@components/button"
import { useRouterAdapter } from "@router"
import { ErrorLayout } from "@errors/error-layout"

export function NotFoundPage() {
  const { useNavigate, useBack } = useRouterAdapter()
  const navigate = useNavigate()
  const back = useBack()

  return (
    <ErrorLayout
      icon={<FileQuestion className="h-16 w-16" strokeWidth={1.5} />}
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    >
      <Button variant="outline" onClick={back}>
        Go back
      </Button>
      <Button onClick={() => navigate("/")}>Back to home</Button>
    </ErrorLayout>
  )
}

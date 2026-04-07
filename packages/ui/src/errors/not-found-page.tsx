import { useRouter } from "@tanstack/react-router"
import { FileQuestion } from "lucide-react"
import { Button } from "../components/button"
import { ErrorLayout } from "./error-layout"

export function NotFoundPage() {
  const router = useRouter()

  return (
    <ErrorLayout
      icon={<FileQuestion className="h-16 w-16" strokeWidth={1.5} />}
      code="404"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    >
      <Button variant="outline" onClick={() => router.history.back()}>
        Go back
      </Button>
      <Button onClick={() => router.navigate({ to: "/" })}>Back to home</Button>
    </ErrorLayout>
  )
}

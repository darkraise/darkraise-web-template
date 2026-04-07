import { useRouter } from "@tanstack/react-router"
import { ServerCrash } from "lucide-react"
import { Button } from "../components/button"
import { ErrorLayout } from "./error-layout"

export function ServerErrorPage() {
  const router = useRouter()

  return (
    <ErrorLayout
      icon={<ServerCrash className="h-16 w-16" strokeWidth={1.5} />}
      code="500"
      title="Server error"
      description="Something went wrong on our end. Please try again later."
    >
      <Button variant="outline" onClick={() => router.invalidate()}>
        Retry
      </Button>
      <Button onClick={() => router.navigate({ to: "/" })}>Back to home</Button>
    </ErrorLayout>
  )
}

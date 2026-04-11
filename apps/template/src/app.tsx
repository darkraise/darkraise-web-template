import { Suspense } from "react"
import { RouterProvider, createRouter } from "@tanstack/react-router"
import { routeTree } from "./routeTree.gen"
import { NotFoundPage, ErrorPage } from "darkraise-ui/errors"

function RouteLoadingFallback() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6">
      <img src="/logo.svg" alt="" className="h-12 w-12 animate-pulse" />
      <div className="h-0.5 w-36 overflow-hidden rounded-full bg-current opacity-[0.08]">
        <div className="animate-slide h-full w-2/5 rounded-full bg-blue-500" />
      </div>
    </div>
  )
}

const router = createRouter({
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: ErrorPage,
  defaultPendingComponent: RouteLoadingFallback,
  defaultPendingMs: 0,
  defaultPendingMinMs: 200,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

export function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

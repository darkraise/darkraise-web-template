import { createRootRoute, Outlet } from "@tanstack/react-router"
import { AppProviders } from "@/providers"
import { RouteFocusManager } from "@/lib/route-focus"
import { NotFoundPage, ErrorPage } from "darkraise-ui/errors"

export const Route = createRootRoute({
  component: () => (
    <AppProviders>
      <RouteFocusManager />
      <Outlet />
    </AppProviders>
  ),
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
})

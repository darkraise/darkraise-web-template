import { createRootRoute, Outlet } from "@tanstack/react-router"
import { AppProviders } from "@/providers"
import { NotFoundPage } from "darkraise-ui/errors"

export const Route = createRootRoute({
  component: () => (
    <AppProviders>
      <Outlet />
    </AppProviders>
  ),
  notFoundComponent: NotFoundPage,
})

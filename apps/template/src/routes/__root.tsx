import { createRootRoute, Outlet } from "@tanstack/react-router"
import { AppProviders } from "@/core/providers"
import { NotFoundPage } from "@/core/errors"

export const Route = createRootRoute({
  component: () => (
    <AppProviders>
      <Outlet />
    </AppProviders>
  ),
  notFoundComponent: NotFoundPage,
})

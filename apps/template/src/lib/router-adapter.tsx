import {
  useNavigate as useTanstackNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router"
import type { RouterAdapter } from "darkraise-ui/router"

import { RouterLink } from "./RouterLink"

export const tanstackRouterAdapter: RouterAdapter = {
  Link: RouterLink,
  useNavigate: () => {
    const navigate = useTanstackNavigate()
    return (to: string) => {
      void navigate({ to })
    }
  },
  usePathname: () => useRouterState().location.pathname,
  useBack: () => {
    const router = useRouter()
    return () => router.history.back()
  },
  useInvalidate: () => {
    const router = useRouter()
    return () => {
      void router.invalidate()
    }
  },
}

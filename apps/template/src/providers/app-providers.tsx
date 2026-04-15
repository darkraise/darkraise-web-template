import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "darkraise-ui/theme"
import { Toaster } from "darkraise-ui/components/sonner"
import { RouterAdapterProvider } from "darkraise-ui/router"
import { tanstackRouterAdapter } from "@/lib/router-adapter"
import { themeConfig } from "@/theme.config"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider config={themeConfig}>
        <RouterAdapterProvider value={tanstackRouterAdapter}>
          {children}
          <Toaster />
        </RouterAdapterProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

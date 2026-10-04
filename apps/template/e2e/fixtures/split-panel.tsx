import type { ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { SplitPanelLayout } from "darkraise-ui/layout"
import {
  RouterAdapterProvider,
  useOptionalRouterAdapter,
} from "darkraise-ui/router"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

// Outside any provider this returns the kit's stub adapter, which is all a
// static shell needs.
function StubRouter({ children }: { children: ReactNode }) {
  return (
    <RouterAdapterProvider value={useOptionalRouterAdapter()}>
      {children}
    </RouterAdapterProvider>
  )
}

// Long enough that the panel, not an inner list, is what scrolls.
const THREADS = Array.from({ length: 40 }, (_, i) => `Thread ${i + 1}`)

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <StubRouter>
      <SplitPanelLayout
        nav={[]}
        panel={
          <ul>
            {THREADS.map((thread) => (
              <li key={thread} style={{ padding: "12px 16px" }}>
                {thread}
              </li>
            ))}
          </ul>
        }
      >
        <p>Select a thread</p>
      </SplitPanelLayout>
    </StubRouter>
  </ThemeProvider>,
)

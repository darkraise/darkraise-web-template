import type { ReactElement } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

// One scenario per page load, chosen by ?case=, so a case's fixed triggers
// and open overlays never shift another case's geometry.
const CASES: Record<string, () => ReactElement> = {}

const name = new URLSearchParams(window.location.search).get("case") ?? ""
const Case = CASES[name]

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div data-testid="overlay-case" data-case={name}>
      {Case ? <Case /> : <p>Unknown case: {name}</p>}
    </div>
  </ThemeProvider>,
)

import { createRoot } from "react-dom/client"
import { ChevronRight } from "lucide-react"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div
      data-testid="rtl"
      style={{
        padding: 24,
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <p style={{ flexBasis: "100%", margin: 0 }}>Right to left</p>
      <div data-probe="icon-inline">
        <ChevronRight className="dr-icon-inline size-4" />
      </div>
    </div>
  </ThemeProvider>,
)

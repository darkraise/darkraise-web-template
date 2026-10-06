import { createRoot } from "react-dom/client"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div
      data-testid="controls-behaviour"
      style={{
        padding: 24,
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <p style={{ flexBasis: "100%", margin: 0 }}>Controls behaviour</p>
    </div>
  </ThemeProvider>,
)

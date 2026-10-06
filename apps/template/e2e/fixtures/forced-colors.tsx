import { createRoot } from "react-dom/client"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

const root = document.getElementById("root")
if (!root) throw new Error("Missing test fixture root")
createRoot(root).render(
  <ThemeProvider>
    <div
      data-testid="forced-colors"
      style={{
        padding: 24,
        display: "flex",
        flexWrap: "wrap",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <p style={{ flexBasis: "100%", margin: 0 }}>Forced colours</p>
      <div
        data-probe="ref-highlight"
        style={{ width: 24, height: 24, backgroundColor: "Highlight" }}
      />
      <div
        data-probe="ref-canvas"
        style={{ width: 24, height: 24, backgroundColor: "Canvas" }}
      />
    </div>
  </ThemeProvider>,
)

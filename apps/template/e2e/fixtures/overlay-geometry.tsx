import type { ReactElement } from "react"
import { createRoot } from "react-dom/client"
import { Button } from "darkraise-ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "darkraise-ui/components/popover"
import { ThemeProvider } from "darkraise-ui/theme"
import "../../src/styles/globals.css"

// The trigger scrolls inside a box and the box is centred, so both a scroll
// and a viewport resize move the trigger without moving the page.
function FollowCase() {
  return (
    <div
      data-testid="scroll-box"
      style={{
        width: 480,
        height: 320,
        margin: "120px auto 0",
        overflow: "auto",
        border: "1px solid",
      }}
    >
      <div
        style={{
          height: 1200,
          paddingTop: 100,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button>Anchor</Button>
          </PopoverTrigger>
          <PopoverContent data-testid="follow-popover">
            Attached to the anchor
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

// One scenario per page load, chosen by ?case=, so a case's fixed triggers
// and open overlays never shift another case's geometry.
const CASES: Record<string, () => ReactElement> = {
  follow: FollowCase,
}

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

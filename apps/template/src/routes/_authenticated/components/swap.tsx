import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import { Swap, SwapIndicator } from "darkraise-ui/components/swap"
import { Menu, Moon, Pause, Play, Sun, X } from "lucide-react"
import { useState } from "react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/swap")({
  component: SwapPage,
})

function SwapPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [playing, setPlaying] = useState(false)

  return (
    <ShowcasePage
      title="Swap"
      description="Crossfade between two children based on a boolean state. Pure presentation — wrap in a button to make it interactive."
    >
      <ShowcaseExample
        title="Hamburger to close"
        code={`<Swap pressed={menuOpen}>
  <SwapIndicator state="on">
    <X className="h-5 w-5" />
  </SwapIndicator>
  <SwapIndicator state="off">
    <Menu className="h-5 w-5" />
  </SwapIndicator>
</Swap>`}
      >
        <Button
          variant="outline"
          size="icon"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Swap pressed={menuOpen}>
            <SwapIndicator state="on">
              <X className="h-5 w-5" />
            </SwapIndicator>
            <SwapIndicator state="off">
              <Menu className="h-5 w-5" />
            </SwapIndicator>
          </Swap>
        </Button>
      </ShowcaseExample>

      <ShowcaseExample
        title="Theme toggle (sun and moon)"
        code={`<Swap pressed={isDark}>
  <SwapIndicator state="on">
    <Moon className="h-5 w-5" />
  </SwapIndicator>
  <SwapIndicator state="off">
    <Sun className="h-5 w-5" />
  </SwapIndicator>
</Swap>`}
      >
        <Button
          variant="outline"
          size="icon"
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => setIsDark((v) => !v)}
        >
          <Swap pressed={isDark}>
            <SwapIndicator state="on">
              <Moon className="h-5 w-5" />
            </SwapIndicator>
            <SwapIndicator state="off">
              <Sun className="h-5 w-5" />
            </SwapIndicator>
          </Swap>
        </Button>
      </ShowcaseExample>

      <ShowcaseExample
        title="Play and pause"
        code={`<Swap pressed={playing}>
  <SwapIndicator state="on">
    <Pause className="h-5 w-5" />
  </SwapIndicator>
  <SwapIndicator state="off">
    <Play className="h-5 w-5" />
  </SwapIndicator>
</Swap>`}
      >
        <Button
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((v) => !v)}
        >
          <Swap pressed={playing}>
            <SwapIndicator state="on">
              <Pause className="h-5 w-5" />
            </SwapIndicator>
            <SwapIndicator state="off">
              <Play className="h-5 w-5" />
            </SwapIndicator>
          </Swap>
        </Button>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

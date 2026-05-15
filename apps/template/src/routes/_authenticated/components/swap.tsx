import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import {
  Swap,
  SwapIndicator,
  type SwapAnimation,
} from "darkraise-ui/components/swap"
import { Menu, Moon, Pause, Play, Sun, X } from "lucide-react"
import { useState } from "react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/swap")({
  component: SwapPage,
})

const ANIMATIONS: SwapAnimation[] = ["fade", "rotate", "flip", "scale", "slide"]

function SwapPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [animDemo, setAnimDemo] = useState(false)

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

      <ShowcaseExample
        title="Transition animations"
        code={`const animations = ["fade", "rotate", "flip", "scale", "slide"] as const

<Swap pressed={pressed} animation="rotate">
  <SwapIndicator state="on">
    <Moon className="h-5 w-5" />
  </SwapIndicator>
  <SwapIndicator state="off">
    <Sun className="h-5 w-5" />
  </SwapIndicator>
</Swap>`}
      >
        <div className="flex flex-wrap items-end gap-4">
          {ANIMATIONS.map((anim) => (
            <div key={anim} className="flex flex-col items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label={`Toggle ${anim} animation demo`}
                onClick={() => setAnimDemo((v) => !v)}
              >
                <Swap pressed={animDemo} animation={anim}>
                  <SwapIndicator state="on">
                    <Moon className="h-5 w-5" />
                  </SwapIndicator>
                  <SwapIndicator state="off">
                    <Sun className="h-5 w-5" />
                  </SwapIndicator>
                </Swap>
              </Button>
              <span className="text-muted-foreground text-xs capitalize">
                {anim}
              </span>
            </div>
          ))}
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

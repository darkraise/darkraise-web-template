import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Progress } from "darkraise-ui/components/progress"
import { Button } from "darkraise-ui/components/button"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/progress")({
  component: ProgressPage,
})

function ProgressPage() {
  const [animProgress, setAnimProgress] = useState(0)
  const [running, setRunning] = useState(false)

  function startAnimation() {
    if (running) return
    setAnimProgress(0)
    setRunning(true)
    let current = 0
    const interval = setInterval(() => {
      current += 2
      setAnimProgress(current)
      if (current >= 100) {
        clearInterval(interval)
        setRunning(false)
      }
    }, 40)
  }

  return (
    <ShowcasePage
      title="Progress"
      description="Horizontal progress bar with value and animation support."
    >
      <ShowcaseExample
        title="Basic progress"
        code={`<Progress value={60} />
<p className="text-muted-foreground mt-2 text-sm">60%</p>`}
      >
        <div className="w-full max-w-sm">
          <Progress value={60} />
          <p className="text-muted-foreground mt-2 text-sm">60%</p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Animated progress"
        code={`const [progress, setProgress] = useState(0)
const [running, setRunning] = useState(false)

function startAnimation() {
  if (running) return
  setProgress(0)
  setRunning(true)
  let current = 0
  const interval = setInterval(() => {
    current += 2
    setProgress(current)
    if (current >= 100) {
      clearInterval(interval)
      setRunning(false)
    }
  }, 40)
}

<div className="w-full max-w-sm space-y-3">
  <div className="flex items-center justify-between text-sm">
    <span>Uploading...</span>
    <span>{progress}%</span>
  </div>
  <Progress value={progress} />
  <Button onClick={startAnimation} disabled={running} size="sm">
    {running ? "Running…" : "Start"}
  </Button>
</div>`}
      >
        <div className="w-full max-w-sm space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Uploading...</span>
            <span>{animProgress}%</span>
          </div>
          <Progress value={animProgress} />
          <Button onClick={startAnimation} disabled={running} size="sm">
            {running ? "Running…" : "Start"}
          </Button>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Sizes"
        code={`<div className="space-y-4">
  <div>
    <p className="text-muted-foreground mb-1 text-xs">Thin (h-1)</p>
    <Progress value={40} className="h-1" />
  </div>
  <div>
    <p className="text-muted-foreground mb-1 text-xs">Default (h-4)</p>
    <Progress value={60} />
  </div>
  <div>
    <p className="text-muted-foreground mb-1 text-xs">Thick (h-6)</p>
    <Progress value={80} className="h-6" />
  </div>
</div>`}
      >
        <div className="w-full max-w-sm space-y-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">Thin (h-1)</p>
            <Progress value={40} className="h-1" />
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">Default (h-4)</p>
            <Progress value={60} />
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs">Thick (h-6)</p>
            <Progress value={80} className="h-6" />
          </div>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="With label"
        code={`<div className="w-full max-w-sm space-y-1">
  <div className="flex items-center justify-between text-sm">
    <span>3 of 5 steps completed</span>
    <span className="text-muted-foreground">60%</span>
  </div>
  <Progress value={60} />
</div>`}
      >
        <div className="w-full max-w-sm space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span>3 of 5 steps completed</span>
            <span className="text-muted-foreground">60%</span>
          </div>
          <Progress value={60} />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Indeterminate / loading"
        code={`<div className="bg-secondary relative h-4 w-full overflow-hidden rounded-full">
  <div className="bg-primary absolute h-full w-1/3 animate-[progress-slide_1.5s_ease-in-out_infinite] rounded-full" />
</div>

/* Add to your CSS/tailwind config:
@keyframes progress-slide {
  0% { left: -33%; }
  100% { left: 100%; }
} */`}
      >
        <div className="w-full max-w-sm">
          <div className="bg-secondary relative h-4 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary absolute h-full w-1/3 rounded-full"
              style={{
                animation: "progress-slide 1.5s ease-in-out infinite",
              }}
            />
            <style>{`
                @keyframes progress-slide {
                  0% { left: -33%; }
                  100% { left: 100%; }
                }
              `}</style>
          </div>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

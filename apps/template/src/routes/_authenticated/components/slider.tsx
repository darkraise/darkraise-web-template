import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Slider } from "darkraise-ui/components/slider"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/slider")({
  component: SliderPage,
})

function SliderPage() {
  const [value, setValue] = useState([50])
  const [rangeValue, setRangeValue] = useState([25])
  const [stepValue, setStepValue] = useState([50])
  const [tierValue, setTierValue] = useState([1])
  const [showStepsValue, setShowStepsValue] = useState([50])
  const [overCapValue, setOverCapValue] = useState([50])

  const tiers = ["compact", "cozy", "comfortable", "spacious"] as const

  return (
    <ShowcasePage
      title="Slider"
      description="An input for selecting a numeric value within a given range."
    >
      <ShowcaseExample
        title="Basic slider"
        code={`const [value, setValue] = useState([50])

<div className="space-y-2">
  <Slider
    value={value}
    onValueChange={setValue}
    min={0}
    max={100}
    step={1}
    className="w-full"
  />
  <p className="text-sm text-muted-foreground">Value: {value[0]}</p>
</div>`}
      >
        <div className="w-full max-w-sm space-y-2">
          <Slider
            value={value}
            onValueChange={setValue}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <p className="text-muted-foreground text-sm">Value: {value[0]}</p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Range slider with labels"
        code={`const [value, setValue] = useState([25])

<div className="space-y-2">
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>0%</span>
    <span>Volume: {value[0]}%</span>
    <span>100%</span>
  </div>
  <Slider value={value} onValueChange={setValue} min={0} max={100} step={1} />
</div>`}
      >
        <div className="w-full max-w-sm space-y-2">
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>0%</span>
            <span>Volume: {rangeValue[0]}%</span>
            <span>100%</span>
          </div>
          <Slider
            value={rangeValue}
            onValueChange={setRangeValue}
            min={0}
            max={100}
            step={1}
          />
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stepped slider"
        code={`const [value, setValue] = useState([50])

<div className="space-y-2">
  <Slider value={value} onValueChange={setValue} min={0} max={100} step={25} />
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>0</span>
    <span>25</span>
    <span>50</span>
    <span>75</span>
    <span>100</span>
  </div>
</div>`}
      >
        <div className="w-full max-w-sm space-y-2">
          <Slider
            value={stepValue}
            onValueChange={setStepValue}
            min={0}
            max={100}
            step={25}
          />
          <div className="text-muted-foreground flex justify-between text-xs">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stepped slider with anchor dots (showSteps)"
        code={`const [value, setValue] = useState([50])

<Slider
  value={value}
  onValueChange={setValue}
  min={0}
  max={100}
  step={25}
  showSteps
/>`}
      >
        <div className="w-full max-w-sm space-y-2">
          <Slider
            value={showStepsValue}
            onValueChange={setShowStepsValue}
            min={0}
            max={100}
            step={25}
            showSteps
          />
          <p className="text-muted-foreground text-xs">
            Value: {showStepsValue[0]} — anchor dots mark every 25-unit stop the
            thumb snaps to (5 stops total).
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Enum slider (4 tiers) with showSteps"
        code={`const tiers = ["compact", "cozy", "comfortable", "spacious"] as const
const [value, setValue] = useState([1])

<Slider
  value={value}
  onValueChange={setValue}
  min={0}
  max={tiers.length - 1}
  step={1}
  showSteps
/>
<p>Selected: {tiers[value[0]]}</p>`}
      >
        <div className="w-full max-w-sm space-y-2">
          <Slider
            value={tierValue}
            onValueChange={setTierValue}
            min={0}
            max={tiers.length - 1}
            step={1}
            showSteps
          />
          <p className="text-muted-foreground text-xs capitalize">
            Selected: {tiers[tierValue[0] ?? 0]}
          </p>
          <p className="text-muted-foreground text-xs">
            Same pattern the ThemeSwitcher uses to render Density, Elevation,
            Radius, and Glow as sliders with snap dots.
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="showSteps auto-suppresses when stop count exceeds 20"
        code={`// 101 stops total (0..100 step 1) — past the 20-stop visibility
// cap, so no dots render even though showSteps is true.
<Slider
  defaultValue={[50]}
  min={0}
  max={100}
  step={1}
  showSteps
/>`}
      >
        <div className="w-full max-w-sm space-y-2">
          <Slider
            value={overCapValue}
            onValueChange={setOverCapValue}
            min={0}
            max={100}
            step={1}
            showSteps
          />
          <p className="text-muted-foreground text-xs">
            Value: {overCapValue[0]} — 101 stops {">"} 20-stop cap, so the
            anchor dots are silently suppressed. Past ~20 stops the dots crowd
            into each other and hurt the track instead of helping.
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Disabled slider"
        code={`<Slider defaultValue={[40]} disabled className="w-full" />`}
      >
        <div className="w-full max-w-sm">
          <Slider defaultValue={[40]} disabled className="w-full" />
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

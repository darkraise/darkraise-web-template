import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AngleSlider } from "darkraise-ui/components/angle-slider"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/angle-slider")(
  {
    component: AngleSliderPage,
  },
)

function AngleSliderPage() {
  const [angle, setAngle] = useState(72)

  return (
    <ShowcasePage
      title="Angle Slider"
      description="A circular slider for picking an angle in degrees. Drag the thumb or use the arrow keys to adjust."
    >
      <ShowcaseExample
        title="Default (uncontrolled)"
        code={`<AngleSlider defaultValue={45} aria-label="Hue" />`}
      >
        <div className="flex items-center gap-4">
          <AngleSlider defaultValue={45} aria-label="Hue" />
          <p className="text-muted-foreground text-sm">
            Focus the slider and use arrow keys to change the angle.
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Controlled with value display"
        code={`const [angle, setAngle] = useState(72)

<AngleSlider
  value={angle}
  onValueChange={setAngle}
  aria-label="Direction"
/>
<span>{angle}°</span>`}
      >
        <div className="flex items-center gap-4">
          <AngleSlider
            value={angle}
            onValueChange={setAngle}
            aria-label="Direction"
          />
          <span className="text-sm font-medium tabular-nums">{angle}°</span>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Disabled"
        code={`<AngleSlider
  value={120}
  onValueChange={() => {}}
  disabled
  aria-label="Locked angle"
/>`}
      >
        <AngleSlider
          value={120}
          onValueChange={() => {}}
          disabled
          aria-label="Locked angle"
        />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

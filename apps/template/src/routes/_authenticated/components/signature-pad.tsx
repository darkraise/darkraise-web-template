import { useRef, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Button } from "darkraise-ui/components/button"
import {
  SignaturePad,
  type SignaturePadHandle,
} from "darkraise-ui/components/signature-pad"
import { Slider } from "darkraise-ui/components/slider"
import { Label } from "darkraise-ui/components/label"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/signature-pad",
)({
  component: SignaturePadPage,
})

function SignaturePadPage() {
  const defaultRef = useRef<SignaturePadHandle>(null)
  const customRef = useRef<SignaturePadHandle>(null)
  const [exportedUrl, setExportedUrl] = useState<string | null>(null)
  const [strokeWidth, setStrokeWidth] = useState(2)

  const handleClear = () => {
    defaultRef.current?.clear()
    setExportedUrl(null)
  }

  const handleExport = () => {
    const url = defaultRef.current?.toDataURL("image/png")
    if (url) setExportedUrl(url)
  }

  return (
    <ShowcasePage
      title="Signature Pad"
      description="A canvas-based signature primitive with pointer-event drawing, imperative clear and export, and customizable stroke styling."
    >
      <ShowcaseExample
        title="Default"
        code={`const ref = useRef<SignaturePadHandle>(null)
const [exportedUrl, setExportedUrl] = useState<string | null>(null)
const [strokeWidth, setStrokeWidth] = useState(2)

<SignaturePad
  ref={ref}
  width={400}
  height={150}
  strokeWidth={strokeWidth}
/>
<Slider
  value={[strokeWidth]}
  onValueChange={(v) => setStrokeWidth(v[0] ?? 2)}
  min={1}
  max={10}
  step={0.5}
/>
<Button onClick={() => ref.current?.clear()}>Clear</Button>
<Button onClick={() => {
  const url = ref.current?.toDataURL("image/png")
  if (url) setExportedUrl(url)
}}>
  Export PNG
</Button>`}
      >
        <div className="space-y-3">
          <div className="border-border inline-block rounded-md border">
            <SignaturePad
              ref={defaultRef}
              width={400}
              height={150}
              strokeWidth={strokeWidth}
            />
          </div>
          <div className="flex max-w-md items-center gap-3">
            <Label className="text-xs whitespace-nowrap">Stroke width</Label>
            <Slider
              value={[strokeWidth]}
              onValueChange={(v) => setStrokeWidth(v[0] ?? 2)}
              min={1}
              max={10}
              step={0.5}
            />
            <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
              {strokeWidth.toFixed(1)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
            <Button onClick={handleExport}>Export PNG</Button>
          </div>
          {exportedUrl ? (
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">Exported preview:</p>
              <img
                src={exportedUrl}
                alt="Exported signature"
                className="border-border rounded-md border"
              />
            </div>
          ) : null}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Custom stroke"
        code={`<SignaturePad
  ref={ref}
  width={400}
  height={150}
  strokeColor="rebeccapurple"
  strokeWidth={4}
/>`}
      >
        <div className="space-y-3">
          <div className="border-border inline-block rounded-md border">
            <SignaturePad
              ref={customRef}
              width={400}
              height={150}
              strokeColor="rebeccapurple"
              strokeWidth={4}
            />
          </div>
          <Button variant="outline" onClick={() => customRef.current?.clear()}>
            Clear
          </Button>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  BackgroundPage,
  BACKGROUND_PAGE_VARIANTS,
} from "darkraise-ui/components/background-page"
import { Button } from "darkraise-ui/components/button"
import { Input } from "darkraise-ui/components/input"
import {
  Carousel,
  CarouselContent,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "darkraise-ui/components/carousel"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/background-page",
)({
  component: BackgroundPagePage,
})

function AuthMock() {
  return (
    <div className="border-border/60 bg-card/70 w-full max-w-[16rem] rounded-xl border p-5 shadow-lg backdrop-blur-md">
      <p className="text-sm font-semibold">Welcome back</p>
      <p className="text-muted-foreground mb-4 text-xs">
        Sign in to your workspace
      </p>
      <div className="space-y-2">
        <Input placeholder="you@example.com" />
        <Input type="password" placeholder="Password" />
        <Button size="sm" className="w-full">
          Sign in
        </Button>
      </div>
    </div>
  )
}

function FactorSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground flex items-center justify-between">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary w-full"
      />
    </label>
  )
}

function FactorDemo() {
  const [speed, setSpeed] = useState(1)
  const [density, setDensity] = useState(1)
  const [intensity, setIntensity] = useState(1)
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <FactorSlider
          label="speed"
          value={speed}
          min={0.1}
          max={3}
          step={0.1}
          onChange={setSpeed}
        />
        <FactorSlider
          label="density"
          value={density}
          min={0.25}
          max={3}
          step={0.05}
          onChange={setDensity}
        />
        <FactorSlider
          label="intensity"
          value={intensity}
          min={0}
          max={1}
          step={0.05}
          onChange={setIntensity}
        />
      </div>
      <BackgroundPage
        variant="flowfield"
        speed={speed}
        density={density}
        intensity={intensity}
        className="grid h-80 place-items-center rounded-lg p-6"
      >
        <AuthMock />
      </BackgroundPage>
    </div>
  )
}

function BackgroundPagePage() {
  return (
    <ShowcasePage
      title="Background Page"
      description="Twelve predefined animated, interactive backgrounds for full-page screens like sign-in and registration. Every variant tracks the active theme and preset, reacts to the pointer, and falls back to a still composition when the visitor prefers reduced motion."
    >
      <ShowcaseExample
        title="Full-page usage — wrap an auth screen"
        code={`<BackgroundPage variant="aurora" className="grid min-h-screen place-items-center p-6">
  <LoginCard />
</BackgroundPage>`}
      >
        <BackgroundPage
          variant="aurora"
          className="grid h-80 place-items-center rounded-lg p-6"
        >
          <AuthMock />
        </BackgroundPage>
      </ShowcaseExample>

      <ShowcaseExample
        title="Tuning factors — drag to adjust speed, density, intensity"
        code={`<BackgroundPage
  variant="flowfield"
  speed={1.5}      // motion rate, 0.1–4 (all variants)
  density={0.8}    // particle/dot count, 0.25–3 (canvas variants)
  intensity={0.9}  // overall opacity / strength, 0–1 (all variants)
/>`}
      >
        <FactorDemo />
      </ShowcaseExample>

      <div>
        <p className="text-muted-foreground mb-4 text-xs font-medium tracking-wide uppercase">
          All variants — use the arrows or dots, and move your cursor across the
          preview
        </p>
        {/* Gutter padding gives the carousel's edge-anchored prev/next controls
            room to sit beside the full-width slides instead of overlapping them. */}
        <div className="px-12">
          <Carousel className="w-full" opts={{ loop: true }}>
            <CarouselContent>
              {BACKGROUND_PAGE_VARIANTS.map((meta, index) => (
                <CarouselItem key={meta.value}>
                  <div className="border-border overflow-hidden rounded-xl border">
                    <BackgroundPage
                      variant={meta.value}
                      className="grid h-[26rem] place-items-center p-6"
                    >
                      <AuthMock />
                    </BackgroundPage>
                    <div className="bg-card border-border flex items-center justify-between gap-4 border-t p-4">
                      <div>
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="text-muted-foreground text-xs">
                          {meta.description}
                        </p>
                      </div>
                      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {index + 1} / {BACKGROUND_PAGE_VARIANTS.length}
                      </span>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
            <CarouselIndicatorGroup>
              {BACKGROUND_PAGE_VARIANTS.map((meta, index) => (
                <CarouselIndicator
                  key={meta.value}
                  index={index}
                  aria-label={meta.label}
                />
              ))}
            </CarouselIndicatorGroup>
          </Carousel>
        </div>
      </div>
    </ShowcasePage>
  )
}

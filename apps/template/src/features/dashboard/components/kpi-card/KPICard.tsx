import { Card, CardContent } from "darkraise-ui/components/card"
import type { KPICardProps } from "../../types"

const WIDTH = 96
const HEIGHT = 40
const INSET = 3

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step = WIDTH / (data.length - 1)
  const points = data.map(
    (value, i) =>
      `${i * step},${HEIGHT - INSET - ((value - min) / range) * (HEIGHT - INSET * 2)}`,
  )

  // preserveAspectRatio="none" stretches the drawing to the box; the strokes
  // opt out of the stretch so the line stays 2px and the baseline 1px.
  return (
    <svg
      data-sparkline
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-10 w-24 shrink-0"
      aria-hidden="true"
    >
      <path
        data-sparkline-area
        d={`M0,${HEIGHT} L${points.join(" L")} L${WIDTH},${HEIGHT} Z`}
        className="fill-primary/15"
      />
      <line
        x1={0}
        y1={HEIGHT - 0.5}
        x2={WIDTH}
        y2={HEIGHT - 0.5}
        className="stroke-border"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        className="stroke-primary"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function KPICard({
  label,
  value,
  comparison,
  sparklineData,
}: KPICardProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-px hover:shadow-md">
      <CardContent className="pt-[var(--density-container-p)]">
        <p className="text-muted-foreground text-sm">{label}</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-medium">{value}</p>
            {comparison && (
              <p className="text-muted-foreground text-xs">{comparison}</p>
            )}
          </div>
          {sparklineData && sparklineData.length > 1 && (
            <Sparkline data={sparklineData} />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

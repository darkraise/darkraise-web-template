import { Card, CardContent } from "darkraise-ui/components/card"
import { Progress } from "darkraise-ui/components/progress"
import type { ProgressCardProps } from "../../types"

export function ProgressCard({
  label,
  value,
  target,
  unit = "",
  formatValue,
}: ProgressCardProps) {
  const percentage = Math.min((value / target) * 100, 100)
  const format = formatValue ?? ((n: number) => `${n.toLocaleString()}${unit}`)

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-muted-foreground text-xs">
            {format(value)} / {format(target)}
          </p>
        </div>
        <Progress value={percentage} className="mt-3 h-2" />
      </CardContent>
    </Card>
  )
}

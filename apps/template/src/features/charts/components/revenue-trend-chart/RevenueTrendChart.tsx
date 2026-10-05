import { AppText } from "@/i18n/AppText"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "darkraise-ui/components/chart"
import { useReducedMotion } from "darkraise-ui/hooks"
import { metricColors } from "../../metric-colors"

const revenueConfig = {
  revenue: { label: <AppText text="Revenue" />, color: metricColors.revenue },
} satisfies ChartConfig

export interface RevenueTrendPoint {
  date: string
  revenue: number
}

export function RevenueTrendChart({ data }: { data: RevenueTrendPoint[] }) {
  const reducedMotion = useReducedMotion()

  return (
    <ChartContainer config={revenueConfig} className="min-h-[300px] w-full">
      <AreaChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          className="text-xs"
        />
        <YAxis tickLine={false} axisLine={false} className="text-xs" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          isAnimationActive={!reducedMotion}
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          fill="var(--color-revenue)"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ChartContainer>
  )
}

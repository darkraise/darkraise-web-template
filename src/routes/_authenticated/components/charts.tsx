import { useState } from "react"
import { BarChart3 as BarChartIcon } from "lucide-react"
import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ChartCard,
} from "@/features/charts"
import { Button } from "@/core/components/ui/button"
import { Skeleton } from "@/core/components/ui/skeleton"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/charts")({
  component: ChartsPage,
})

const monthlyData = [
  { month: "Jan", revenue: 4200, orders: 120 },
  { month: "Feb", revenue: 5800, orders: 165 },
  { month: "Mar", revenue: 4900, orders: 140 },
  { month: "Apr", revenue: 6700, orders: 190 },
  { month: "May", revenue: 7200, orders: 210 },
  { month: "Jun", revenue: 6100, orders: 175 },
]

const pieData = [
  { name: "Electronics", value: 4200 },
  { name: "Clothing", value: 3100 },
  { name: "Food", value: 2400 },
  { name: "Books", value: 1800 },
]

const weeklyData = [
  { day: "Mon", visitors: 320, conversions: 45 },
  { day: "Tue", visitors: 480, conversions: 72 },
  { day: "Wed", visitors: 390, conversions: 58 },
  { day: "Thu", visitors: 520, conversions: 89 },
  { day: "Fri", visitors: 610, conversions: 95 },
  { day: "Sat", visitors: 280, conversions: 38 },
  { day: "Sun", visitors: 200, conversions: 27 },
]

const periodData = {
  "7D": [
    { date: "Mon", revenue: 1200 },
    { date: "Tue", revenue: 1850 },
    { date: "Wed", revenue: 1400 },
    { date: "Thu", revenue: 2100 },
    { date: "Fri", revenue: 1750 },
    { date: "Sat", revenue: 900 },
    { date: "Sun", revenue: 650 },
  ],
  "30D": [
    { date: "W1", revenue: 8200 },
    { date: "W2", revenue: 9400 },
    { date: "W3", revenue: 7800 },
    { date: "W4", revenue: 11200 },
    { date: "W5", revenue: 10500 },
    { date: "W6", revenue: 9100 },
    { date: "W7", revenue: 12300 },
    { date: "W8", revenue: 11800 },
    { date: "W9", revenue: 10200 },
    { date: "W10", revenue: 13500 },
  ],
  "90D": [
    { date: "Jan", revenue: 32000 },
    { date: "Feb", revenue: 41000 },
    { date: "Mar", revenue: 38000 },
    { date: "Apr", revenue: 52000 },
    { date: "May", revenue: 47000 },
    { date: "Jun", revenue: 61000 },
  ],
}

type Period = keyof typeof periodData

function PeriodToggleChartExample() {
  const [period, setPeriod] = useState<Period>("30D")

  return (
    <ChartCard title="Revenue by Period">
      <div className="mb-4 flex gap-2">
        {(["7D", "30D", "90D"] as Period[]).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
          >
            {p}
          </Button>
        ))}
      </div>
      <LineChart
        data={periodData[period]}
        xKey="date"
        yKeys={["revenue"]}
        height={200}
      />
    </ChartCard>
  )
}

function ChartsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Charts" },
        ]}
        title="Charts"
        description="Area, Bar, Line, and Pie charts built on Recharts. Wrap any chart in ChartCard for a titled container."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="AreaChart — filled area under a line"
          code={`<ChartCard title="Revenue" description="Monthly revenue trend">
  <AreaChart
    data={data}
    xKey="month"
    yKeys={["revenue"]}
    height={200}
  />
</ChartCard>`}
        >
          <ChartCard title="Revenue" description="Monthly revenue trend">
            <AreaChart
              data={monthlyData}
              xKey="month"
              yKeys={["revenue"]}
              height={200}
            />
          </ChartCard>
        </ShowcaseExample>

        <ShowcaseExample
          title="BarChart — discrete category comparison"
          code={`<ChartCard title="Orders" description="Monthly order volume">
  <BarChart
    data={data}
    xKey="month"
    yKeys={["orders"]}
    height={200}
  />
</ChartCard>`}
        >
          <ChartCard title="Orders" description="Monthly order volume">
            <BarChart
              data={monthlyData}
              xKey="month"
              yKeys={["orders"]}
              height={200}
            />
          </ChartCard>
        </ShowcaseExample>

        <ShowcaseExample
          title="LineChart — multiple series comparison"
          code={`// Multiple yKeys renders multiple lines
<ChartCard title="Revenue vs Orders" description="Dual-series line comparison">
  <LineChart
    data={data}
    xKey="month"
    yKeys={["revenue", "orders"]}
    height={200}
  />
</ChartCard>`}
        >
          <ChartCard
            title="Revenue vs Orders"
            description="Dual-series line comparison"
          >
            <LineChart
              data={monthlyData}
              xKey="month"
              yKeys={["revenue", "orders"]}
              height={200}
            />
          </ChartCard>
        </ShowcaseExample>

        <ShowcaseExample
          title="PieChart — proportional distribution"
          code={`// innerRadius > 0 renders a donut chart
<ChartCard title="Category Breakdown" description="Revenue by category">
  <PieChart data={pieData} height={200} innerRadius={40} />
</ChartCard>

// Filled pie
<ChartCard title="Category Breakdown">
  <PieChart data={pieData} height={200} />
</ChartCard>`}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <ChartCard
              title="Category Breakdown (donut)"
              description="Revenue by category"
            >
              <PieChart data={pieData} height={200} innerRadius={40} />
            </ChartCard>
            <ChartCard
              title="Category Breakdown (filled)"
              description="Revenue by category"
            >
              <PieChart data={pieData} height={200} />
            </ChartCard>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="All four charts in a 2×2 grid"
          code={`<div className="grid gap-6 sm:grid-cols-2">
  <ChartCard title="Revenue">
    <AreaChart data={data} xKey="month" yKeys={["revenue"]} height={200} />
  </ChartCard>
  <ChartCard title="Orders">
    <BarChart data={data} xKey="month" yKeys={["orders"]} height={200} />
  </ChartCard>
  <ChartCard title="Revenue vs Orders">
    <LineChart data={data} xKey="month" yKeys={["revenue", "orders"]} height={200} />
  </ChartCard>
  <ChartCard title="Category Breakdown">
    <PieChart data={pieData} height={200} innerRadius={40} />
  </ChartCard>
</div>`}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <ChartCard title="Revenue" description="Monthly revenue trend">
              <AreaChart
                data={monthlyData}
                xKey="month"
                yKeys={["revenue"]}
                height={200}
              />
            </ChartCard>
            <ChartCard title="Orders" description="Monthly order volume">
              <BarChart
                data={monthlyData}
                xKey="month"
                yKeys={["orders"]}
                height={200}
              />
            </ChartCard>
            <ChartCard
              title="Visitors vs Conversions"
              description="Weekly site traffic"
            >
              <LineChart
                data={weeklyData}
                xKey="day"
                yKeys={["visitors", "conversions"]}
                height={200}
              />
            </ChartCard>
            <ChartCard
              title="Category Breakdown"
              description="Revenue by category"
            >
              <PieChart data={pieData} height={200} innerRadius={40} />
            </ChartCard>
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="Period toggle — interactive date range selector"
          code={`function PeriodToggleChartExample() {
  const [period, setPeriod] = useState<"7D" | "30D" | "90D">("30D")

  return (
    <ChartCard title="Revenue by Period">
      <div className="mb-4 flex gap-2">
        {(["7D", "30D", "90D"] as const).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
          >
            {p}
          </Button>
        ))}
      </div>
      <LineChart data={periodData[period]} xKey="date" yKeys={["revenue"]} height={200} />
    </ChartCard>
  )
}`}
        >
          <PeriodToggleChartExample />
        </ShowcaseExample>

        <ShowcaseExample
          title="Chart loading skeleton"
          code={`<ChartCard title="Loading Chart">
  <Skeleton className="h-4 w-32 mb-4" />
  <Skeleton className="h-[250px] w-full" />
  <div className="mt-4 flex gap-3">
    <Skeleton className="h-3 w-16" />
    <Skeleton className="h-3 w-16" />
    <Skeleton className="h-3 w-16" />
  </div>
</ChartCard>`}
        >
          <ChartCard title="Loading Chart">
            <Skeleton className="mb-4 h-4 w-32" />
            <Skeleton className="h-[250px] w-full" />
            <div className="mt-4 flex gap-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </ChartCard>
        </ShowcaseExample>

        <ShowcaseExample
          title="Chart empty state"
          code={`<ChartCard title="Sales Overview">
  <div className="flex min-h-[250px] flex-col items-center justify-center">
    <BarChart3 className="h-12 w-12 text-muted-foreground" />
    <p className="mt-4 text-base font-medium">No data available</p>
    <p className="mt-1 text-sm text-muted-foreground">
      Try adjusting your filters or date range.
    </p>
  </div>
</ChartCard>`}
        >
          <ChartCard title="Sales Overview">
            <div className="flex min-h-[250px] flex-col items-center justify-center">
              <BarChartIcon className="text-muted-foreground h-12 w-12" />
              <p className="mt-4 text-base font-medium">No data available</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Try adjusting your filters or date range.
              </p>
            </div>
          </ChartCard>
        </ShowcaseExample>
      </div>
    </div>
  )
}

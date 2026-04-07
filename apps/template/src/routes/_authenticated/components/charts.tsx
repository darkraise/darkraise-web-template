import { useState } from "react"
import { BarChart3 as BarChartIcon } from "lucide-react"
import { createFileRoute } from "@tanstack/react-router"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  ChartCard,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/features/charts"
import { Button } from "darkraise-ui/components/button"
import { Skeleton } from "darkraise-ui/components/skeleton"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

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

const pieColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
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

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

const ordersConfig = {
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

const revenueOrdersConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

const pieConfig = {
  Electronics: { label: "Electronics", color: "var(--chart-1)" },
  Clothing: { label: "Clothing", color: "var(--chart-2)" },
  Food: { label: "Food", color: "var(--chart-3)" },
  Books: { label: "Books", color: "var(--chart-4)" },
} satisfies ChartConfig

const visitorsConversionsConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
  conversions: { label: "Conversions", color: "var(--chart-2)" },
} satisfies ChartConfig

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
      <ChartContainer config={revenueConfig} className="min-h-[200px] w-full">
        <LineChart data={periodData[period]}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            className="text-xs"
          />
          <YAxis tickLine={false} axisLine={false} className="text-xs" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  )
}

function ChartsPage() {
  return (
    <ShowcasePage
      title="Charts"
      description="Area, Bar, Line, and Pie charts built on Recharts via the shadcn chart system. Wrap any chart in ChartCard for a titled container."
    >
      <ShowcaseExample
        title="AreaChart — filled area under a line"
        code={`import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/features/charts"

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

<ChartCard title="Revenue" description="Monthly revenue trend">
  <ChartContainer config={revenueConfig} className="min-h-[200px] w-full">
    <AreaChart data={data}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey="month" tickLine={false} axisLine={false} />
      <YAxis tickLine={false} axisLine={false} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.1} />
    </AreaChart>
  </ChartContainer>
</ChartCard>`}
      >
        <ChartCard title="Revenue" description="Monthly revenue trend">
          <ChartContainer
            config={revenueConfig}
            className="min-h-[200px] w-full"
          >
            <AreaChart data={monthlyData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                fill="var(--color-revenue)"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ChartContainer>
        </ChartCard>
      </ShowcaseExample>

      <ShowcaseExample
        title="BarChart — discrete category comparison"
        code={`import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/features/charts"

const ordersConfig = {
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

<ChartCard title="Orders" description="Monthly order volume">
  <ChartContainer config={ordersConfig} className="min-h-[200px] w-full">
    <BarChart data={data}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey="month" tickLine={false} axisLine={false} />
      <YAxis tickLine={false} axisLine={false} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ChartContainer>
</ChartCard>`}
      >
        <ChartCard title="Orders" description="Monthly order volume">
          <ChartContainer
            config={ordersConfig}
            className="min-h-[200px] w-full"
          >
            <BarChart data={monthlyData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="orders"
                fill="var(--color-orders)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </ShowcaseExample>

      <ShowcaseExample
        title="LineChart — multiple series comparison"
        code={`// Multiple dataKey Lines renders multiple series
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/features/charts"

const revenueOrdersConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig

<ChartCard title="Revenue vs Orders" description="Dual-series line comparison">
  <ChartContainer config={revenueOrdersConfig} className="min-h-[200px] w-full">
    <LineChart data={data}>
      <CartesianGrid vertical={false} strokeDasharray="3 3" />
      <XAxis dataKey="month" tickLine={false} axisLine={false} />
      <YAxis tickLine={false} axisLine={false} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
      <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
    </LineChart>
  </ChartContainer>
</ChartCard>`}
      >
        <ChartCard
          title="Revenue vs Orders"
          description="Dual-series line comparison"
        >
          <ChartContainer
            config={revenueOrdersConfig}
            className="min-h-[200px] w-full"
          >
            <LineChart data={monthlyData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="var(--color-orders)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </ChartCard>
      </ShowcaseExample>

      <ShowcaseExample
        title="PieChart — proportional distribution"
        code={`// innerRadius > 0 renders a donut chart
import { PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/features/charts"

const pieConfig = {
  Electronics: { label: "Electronics", color: "var(--chart-1)" },
  Clothing: { label: "Clothing", color: "var(--chart-2)" },
  Food: { label: "Food", color: "var(--chart-3)" },
  Books: { label: "Books", color: "var(--chart-4)" },
} satisfies ChartConfig

const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]

<ChartCard title="Category Breakdown" description="Revenue by category">
  <ChartContainer config={pieConfig} className="min-h-[200px] w-full">
    <PieChart>
      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" nameKey="name">
        {pieData.map((entry, i) => (
          <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
        ))}
      </Pie>
      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
    </PieChart>
  </ChartContainer>
</ChartCard>

// Filled pie (no innerRadius)
<ChartCard title="Category Breakdown">
  <ChartContainer config={pieConfig} className="min-h-[200px] w-full">
    <PieChart>
      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
        {pieData.map((entry, i) => (
          <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
        ))}
      </Pie>
      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
    </PieChart>
  </ChartContainer>
</ChartCard>`}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <ChartCard
            title="Category Breakdown (donut)"
            description="Revenue by category"
          >
            <ChartContainer config={pieConfig} className="min-h-[200px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[i % pieColors.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" />}
                />
              </PieChart>
            </ChartContainer>
          </ChartCard>
          <ChartCard
            title="Category Breakdown (filled)"
            description="Revenue by category"
          >
            <ChartContainer config={pieConfig} className="min-h-[200px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[i % pieColors.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" />}
                />
              </PieChart>
            </ChartContainer>
          </ChartCard>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="All four charts in a 2×2 grid"
        code={`<div className="grid gap-6 sm:grid-cols-2">
  <ChartCard title="Revenue">
    <ChartContainer config={revenueConfig} className="min-h-[200px] w-full">
      <AreaChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area type="monotone" dataKey="revenue" stroke="var(--color-revenue)" fill="var(--color-revenue)" fillOpacity={0.1} />
      </AreaChart>
    </ChartContainer>
  </ChartCard>
  <ChartCard title="Orders">
    <ChartContainer config={ordersConfig} className="min-h-[200px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  </ChartCard>
  <ChartCard title="Revenue vs Orders">
    <ChartContainer config={revenueOrdersConfig} className="min-h-[200px] w-full">
      <LineChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  </ChartCard>
  <ChartCard title="Category Breakdown">
    <ChartContainer config={pieConfig} className="min-h-[200px] w-full">
      <PieChart>
        <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" nameKey="name">
          {pieData.map((entry, i) => (
            <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  </ChartCard>
</div>`}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <ChartCard title="Revenue" description="Monthly revenue trend">
            <ChartContainer
              config={revenueConfig}
              className="min-h-[200px] w-full"
            >
              <AreaChart data={monthlyData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="var(--color-revenue)"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>
          <ChartCard title="Orders" description="Monthly order volume">
            <ChartContainer
              config={ordersConfig}
              className="min-h-[200px] w-full"
            >
              <BarChart data={monthlyData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="orders"
                  fill="var(--color-orders)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>
          <ChartCard
            title="Visitors vs Conversions"
            description="Weekly site traffic"
          >
            <ChartContainer
              config={visitorsConversionsConfig}
              className="min-h-[200px] w-full"
            >
              <LineChart data={weeklyData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="var(--color-visitors)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="var(--color-conversions)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </ChartCard>
          <ChartCard
            title="Category Breakdown"
            description="Revenue by category"
          >
            <ChartContainer config={pieConfig} className="min-h-[200px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[i % pieColors.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="name" />}
                />
              </PieChart>
            </ChartContainer>
          </ChartCard>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Period toggle — interactive date range selector"
        code={`function PeriodToggleChartExample() {
  const [period, setPeriod] = useState<"7D" | "30D" | "90D">("30D")

  const revenueConfig = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
  } satisfies ChartConfig

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
      <ChartContainer config={revenueConfig} className="min-h-[200px] w-full">
        <LineChart data={periodData[period]}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
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
    </ShowcasePage>
  )
}

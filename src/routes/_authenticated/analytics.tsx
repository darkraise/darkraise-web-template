import { createFileRoute } from "@tanstack/react-router"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { PageHeader } from "@/core/layout"
import {
  ChartCard,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/features/charts"
import { useAnalytics, useOrders } from "@/demo/hooks"

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
})

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

const trafficConfig = {
  "Organic Search": { label: "Organic Search", color: "var(--chart-1)" },
  Direct: { label: "Direct", color: "var(--chart-2)" },
  "Social Media": { label: "Social Media", color: "var(--chart-3)" },
  Email: { label: "Email", color: "var(--chart-4)" },
  Referral: { label: "Referral", color: "var(--chart-5)" },
} satisfies ChartConfig

const trafficColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const ordersVisitorsConfig = {
  orders: { label: "Orders", color: "var(--chart-1)" },
  visitors: { label: "Visitors", color: "var(--chart-2)" },
} satisfies ChartConfig

const productRevenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-3)" },
} satisfies ChartConfig

function AnalyticsPage() {
  const { data: analytics } = useAnalytics(30)
  const { data: orders } = useOrders()

  const revenueData = analytics
    ? analytics.map((a) => ({
        date: a.date.slice(5),
        revenue: a.revenue,
      }))
    : []

  const trafficSources = [
    { name: "Organic Search", value: 42 },
    { name: "Direct", value: 28 },
    { name: "Social Media", value: 18 },
    { name: "Email", value: 8 },
    { name: "Referral", value: 4 },
  ]

  const ordersOverTime = analytics
    ? analytics.map((a) => ({
        date: a.date.slice(5),
        orders: a.orders,
        visitors: Math.round(a.visitors / 10),
      }))
    : []

  const productSales = new Map<string, number>()
  if (orders) {
    for (const order of orders) {
      for (const item of order.items) {
        const current = productSales.get(item.name) ?? 0
        productSales.set(item.name, current + item.quantity * item.price)
      }
    }
  }
  const topProductRevenue = Array.from(productSales.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, revenue]) => ({
      name: name.split(" ").slice(0, 2).join(" "),
      revenue,
    }))

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Analytics" },
        ]}
        title="Analytics"
        description="Detailed performance metrics and trends"
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Revenue Trend"
            description="Daily revenue over the last 30 days"
          >
            <ChartContainer
              config={revenueConfig}
              className="min-h-[300px] w-full"
            >
              <LineChart data={revenueData}>
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
          <ChartCard
            title="Traffic Sources"
            description="Visitor acquisition breakdown"
          >
            <ChartContainer
              config={trafficConfig}
              className="min-h-[300px] w-full"
            >
              <PieChart>
                <Pie
                  data={trafficSources}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {trafficSources.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={trafficColors[i % trafficColors.length]}
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

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Orders & Visitors"
            description="Daily orders and scaled visitor count"
          >
            <ChartContainer
              config={ordersVisitorsConfig}
              className="min-h-[300px] w-full"
            >
              <AreaChart data={ordersOverTime}>
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
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--color-orders)"
                  fill="var(--color-orders)"
                  fillOpacity={0.1}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="var(--color-visitors)"
                  fill="var(--color-visitors)"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>
          <ChartCard
            title="Top Products by Revenue"
            description="Highest revenue-generating products"
          >
            <ChartContainer
              config={productRevenueConfig}
              className="min-h-[300px] w-full"
            >
              <BarChart data={topProductRevenue}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </div>
      </div>
    </>
  )
}

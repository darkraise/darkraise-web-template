import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import {
  LineChart,
  PieChart,
  AreaChart,
  BarChart,
  ChartCard,
} from "@/features/charts"
import { useAnalytics, useOrders } from "@/demo/hooks"

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
})

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
            <LineChart data={revenueData} xKey="date" yKeys={["revenue"]} />
          </ChartCard>
          <ChartCard
            title="Traffic Sources"
            description="Visitor acquisition breakdown"
          >
            <PieChart data={trafficSources} innerRadius={50} />
          </ChartCard>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Orders & Visitors"
            description="Daily orders and scaled visitor count"
          >
            <AreaChart
              data={ordersOverTime}
              xKey="date"
              yKeys={["orders", "visitors"]}
            />
          </ChartCard>
          <ChartCard
            title="Top Products by Revenue"
            description="Highest revenue-generating products"
          >
            <BarChart
              data={topProductRevenue}
              xKey="name"
              yKeys={["revenue"]}
            />
          </ChartCard>
        </div>
      </div>
    </>
  )
}

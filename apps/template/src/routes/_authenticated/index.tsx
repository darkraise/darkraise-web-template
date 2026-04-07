import { createFileRoute } from "@tanstack/react-router"
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { PageHeader } from "darkraise-ui/layout"
import { Button } from "darkraise-ui/components/button"
import {
  StatCard,
  KPICard,
  ProgressCard,
  ActivityFeed,
  MetricGrid,
} from "@/features/dashboard"
import {
  ChartCard,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/features/charts"
import { useOrders, useCustomers, useAnalytics } from "@/demo/hooks"

export const Route = createFileRoute("/_authenticated/")({
  component: DashboardPage,
})

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

const topProductsConfig = {
  count: { label: "Count", color: "var(--chart-2)" },
} satisfies ChartConfig

function DashboardPage() {
  const { data: orders } = useOrders()
  const { data: customers } = useCustomers()
  const { data: analytics } = useAnalytics(30)

  const totalRevenue = orders?.reduce((sum, o) => sum + o.total, 0) ?? 0
  const totalOrders = orders?.length ?? 0
  const totalCustomers = customers?.length ?? 0
  const conversionRate =
    analytics && analytics.length > 0
      ? (
          analytics.reduce((sum, a) => sum + a.conversion, 0) / analytics.length
        ).toFixed(1)
      : "0"

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const returningCustomers = customers
    ? customers.filter((c) => c.totalOrders > 1).length
    : 0
  const returningPct =
    totalCustomers > 0
      ? ((returningCustomers / totalCustomers) * 100).toFixed(0)
      : "0"

  const revenueSparkline = analytics
    ? analytics.slice(-14).map((a) => a.revenue)
    : []
  const orderSparkline = analytics
    ? analytics.slice(-14).map((a) => a.orders)
    : []

  const revenueChartData = analytics
    ? analytics.map((a) => ({ date: a.date.slice(5), revenue: a.revenue }))
    : []

  const categoryMap = new Map<string, number>()
  if (orders) {
    for (const order of orders) {
      for (const item of order.items) {
        const current = categoryMap.get(item.name) ?? 0
        categoryMap.set(item.name, current + item.quantity)
      }
    }
  }
  const topProducts = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({
      name: name.split(" ").slice(0, 2).join(" "),
      count,
    }))

  const monthlySalesTarget = 50000
  const currentMonthRevenue = analytics
    ? analytics.slice(-30).reduce((sum, a) => sum + a.revenue, 0)
    : 0

  const recentActivity = orders
    ? orders.slice(0, 8).map((o) => ({
        id: o.id,
        user: { name: o.customer.name },
        action: `placed order ${o.orderNumber} for $${o.total.toLocaleString()}`,
        timestamp: new Date(o.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }))
    : []

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description="Overview of your store performance"
        actions={
          <Button variant="outline" size="sm">
            Download Report
          </Button>
        }
      />

      <div className="space-y-6">
        <MetricGrid columns={4}>
          <StatCard
            label="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatCard
            label="Total Orders"
            value={totalOrders}
            icon={ShoppingCart}
            trend={{ value: 8.2, isPositive: true }}
          />
          <StatCard
            label="Total Customers"
            value={totalCustomers}
            icon={Users}
            trend={{ value: 4.1, isPositive: true }}
          />
          <StatCard
            label="Conversion Rate"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend={{ value: 1.3, isPositive: false }}
          />
        </MetricGrid>

        <div className="grid gap-4 md:grid-cols-2">
          <KPICard
            label="Average Order Value"
            value={`$${avgOrderValue.toFixed(2)}`}
            comparison="vs $52.30 last month"
            sparklineData={revenueSparkline}
          />
          <KPICard
            label="Returning Customers"
            value={`${returningPct}%`}
            comparison={`${returningCustomers} of ${totalCustomers} customers`}
            sparklineData={orderSparkline}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Revenue Trend"
            description="Daily revenue over the last 30 days"
          >
            <ChartContainer
              config={revenueConfig}
              className="min-h-[300px] w-full"
            >
              <AreaChart data={revenueChartData}>
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
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="var(--color-revenue)"
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>
          <ChartCard
            title="Top Products by Quantity"
            description="Most ordered products"
          >
            <ChartContainer
              config={topProductsConfig}
              className="min-h-[300px] w-full"
            >
              <BarChart data={topProducts}>
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
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </ChartCard>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ProgressCard
            label="Monthly Sales Target"
            value={currentMonthRevenue}
            target={monthlySalesTarget}
            unit="$"
          />
          <div className="md:col-span-2">
            <ActivityFeed items={recentActivity} title="Recent Orders" />
          </div>
        </div>
      </div>
    </>
  )
}

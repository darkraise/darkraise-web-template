import { createFileRoute } from "@tanstack/react-router"
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Download,
} from "lucide-react"
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
import { Skeleton } from "darkraise-ui/components/skeleton"
import { toast } from "darkraise-ui/components/sonner"
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
  count: { label: "Count", color: "var(--chart-1)" },
} satisfies ChartConfig

const currency = (n: number) => `$${Math.round(n).toLocaleString()}`
const sumOf = (values: number[]) => values.reduce((acc, n) => acc + n, 0)

// Period-over-period trend: compares the sum of the most recent half of a
// daily series against the prior half. Returns undefined when there isn't
// enough data, so cards can omit a trend rather than show a fabricated one.
function seriesTrend(values: number[]) {
  if (values.length < 4) return undefined
  const mid = Math.floor(values.length / 2)
  const prev = sumOf(values.slice(0, mid))
  const curr = sumOf(values.slice(mid))
  if (prev === 0) return undefined
  const pct = ((curr - prev) / prev) * 100
  return { value: Math.round(Math.abs(pct) * 10) / 10, isPositive: pct >= 0 }
}

function DashboardPage() {
  const { data: orders, isLoading: ordersLoading } = useOrders()
  const { data: customers, isLoading: customersLoading } = useCustomers()
  const { data: analytics, isLoading: analyticsLoading } = useAnalytics(30)

  const isLoading = ordersLoading || customersLoading || analyticsLoading

  const totalRevenue = orders?.reduce((acc, o) => acc + o.total, 0) ?? 0
  const totalOrders = orders?.length ?? 0
  const totalCustomers = customers?.length ?? 0
  const conversionRate =
    analytics && analytics.length > 0
      ? (sumOf(analytics.map((a) => a.conversion)) / analytics.length).toFixed(
          1,
        )
      : "0"

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const returningCustomers = customers
    ? customers.filter((c) => c.totalOrders > 1).length
    : 0
  const returningPct =
    totalCustomers > 0
      ? ((returningCustomers / totalCustomers) * 100).toFixed(0)
      : "0"

  // Trends are derived from the daily analytics series (recent half vs prior
  // half) so the arrows reflect the actual data instead of static literals.
  const revenueTrend = seriesTrend(analytics?.map((a) => a.revenue) ?? [])
  const ordersTrend = seriesTrend(analytics?.map((a) => a.orders) ?? [])
  const customersTrend = seriesTrend(analytics?.map((a) => a.visitors) ?? [])
  const conversionTrend = seriesTrend(analytics?.map((a) => a.conversion) ?? [])

  // Average-order-value sparkline and prior-period comparison, both from the
  // same daily revenue/orders series so the mini-chart matches its label.
  const aovSparkline = analytics
    ? analytics.slice(-14).map((a) => (a.orders > 0 ? a.revenue / a.orders : 0))
    : []
  const half = analytics ? Math.floor(analytics.length / 2) : 0
  const priorOrders = analytics
    ? sumOf(analytics.slice(0, half).map((a) => a.orders))
    : 0
  const priorAov =
    analytics && priorOrders > 0
      ? sumOf(analytics.slice(0, half).map((a) => a.revenue)) / priorOrders
      : 0

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

  const monthlySalesTarget = 150000
  const currentMonthRevenue = analytics
    ? sumOf(analytics.slice(-30).map((a) => a.revenue))
    : 0

  const handleDownloadReport = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue", String(totalRevenue)],
      ["Total Orders", String(totalOrders)],
      ["Total Customers", String(totalCustomers)],
      ["Conversion Rate", `${conversionRate}%`],
      ["Average Order Value", avgOrderValue.toFixed(2)],
      ["Returning Customers", `${returningPct}%`],
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "dashboard-report.csv"
    link.click()
    URL.revokeObjectURL(url)
    toast.success("Report downloaded")
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

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
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4" />
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
            trend={revenueTrend}
          />
          <StatCard
            label="Total Orders"
            value={totalOrders}
            icon={ShoppingCart}
            trend={ordersTrend}
          />
          <StatCard
            label="Total Customers"
            value={totalCustomers}
            icon={Users}
            trend={customersTrend}
          />
          <StatCard
            label="Conversion Rate"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend={conversionTrend}
          />
        </MetricGrid>

        <div className="grid gap-4 md:grid-cols-2">
          <KPICard
            label="Average Order Value"
            value={`$${avgOrderValue.toFixed(2)}`}
            comparison={
              priorAov > 0
                ? `vs $${priorAov.toFixed(2)} prior period`
                : undefined
            }
            sparklineData={aovSparkline}
          />
          <KPICard
            label="Returning Customers"
            value={`${returningPct}%`}
            comparison={`${returningCustomers} of ${totalCustomers} customers`}
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
            formatValue={currency}
          />
          <div className="md:col-span-2">
            <ActivityFeed items={recentActivity} title="Recent Orders" />
          </div>
        </div>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        title="Dashboard"
        description="Overview of your store performance"
      />
      <div className="space-y-6">
        <MetricGrid columns={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] w-full rounded-xl" />
          ))}
        </MetricGrid>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[104px] w-full rounded-xl" />
          <Skeleton className="h-[104px] w-full rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[360px] w-full rounded-xl" />
          <Skeleton className="h-[360px] w-full rounded-xl" />
        </div>
      </div>
    </>
  )
}

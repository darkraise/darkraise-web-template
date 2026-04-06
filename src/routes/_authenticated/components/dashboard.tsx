import { createFileRoute } from "@tanstack/react-router"
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react"
import { Badge } from "@/core/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/components/ui/card"
import { Separator } from "@/core/components/ui/separator"
import { PageHeader } from "@/core/layout"
import {
  StatCard,
  KPICard,
  ProgressCard,
  ActivityFeed,
  MetricGrid,
} from "@/features/dashboard"
import type { ActivityItem } from "@/features/dashboard"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/dashboard")({
  component: DashboardPage,
})

const activityItems: ActivityItem[] = [
  {
    id: "1",
    user: { name: "Alice Johnson" },
    action: "placed a new order #1042",
    timestamp: "2 minutes ago",
  },
  {
    id: "2",
    user: { name: "Bob Smith" },
    action: "updated product listing for Widget Pro",
    timestamp: "15 minutes ago",
  },
  {
    id: "3",
    user: { name: "Carol White" },
    action: "processed refund for order #987",
    timestamp: "1 hour ago",
  },
  {
    id: "4",
    user: { name: "David Lee" },
    action: "added a new team member",
    timestamp: "3 hours ago",
  },
]

function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Dashboard" },
        ]}
        title="Dashboard Components"
        description="High-level metric cards, KPI displays, progress indicators, and activity feeds."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="StatCard — metric with icon and trend"
          code={`<MetricGrid columns={4}>
  <StatCard
    label="Total Revenue"
    value="$34,200"
    icon={DollarSign}
    trend={{ value: 12.5, isPositive: true }}
  />
  <StatCard
    label="Orders"
    value="1,240"
    icon={ShoppingCart}
    trend={{ value: 3.2, isPositive: false }}
  />
  <StatCard
    label="Customers"
    value="8,340"
    icon={Users}
    trend={{ value: 8.1, isPositive: true }}
  />
  <StatCard
    label="Growth"
    value="+22%"
    icon={TrendingUp}
    trend={{ value: 4.7, isPositive: true }}
  />
</MetricGrid>`}
        >
          <MetricGrid columns={4}>
            <StatCard
              label="Total Revenue"
              value="$34,200"
              icon={DollarSign}
              trend={{ value: 12.5, isPositive: true }}
            />
            <StatCard
              label="Orders"
              value="1,240"
              icon={ShoppingCart}
              trend={{ value: 3.2, isPositive: false }}
            />
            <StatCard
              label="Customers"
              value="8,340"
              icon={Users}
              trend={{ value: 8.1, isPositive: true }}
            />
            <StatCard
              label="Growth"
              value="+22%"
              icon={TrendingUp}
              trend={{ value: 4.7, isPositive: true }}
            />
          </MetricGrid>
        </ShowcaseExample>

        <ShowcaseExample
          title="KPICard — value with sparkline and comparison"
          code={`<KPICard
  label="Monthly Revenue"
  value="$7,200"
  comparison="vs $6,100 last month"
  sparklineData={[4200, 5800, 4900, 6700, 7200, 6100]}
/>`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <KPICard
              label="Monthly Revenue"
              value="$7,200"
              comparison="vs $6,100 last month"
              sparklineData={[4200, 5800, 4900, 6700, 7200, 6100]}
            />
            <KPICard
              label="Active Users"
              value="2,840"
              comparison="vs 2,100 last month"
              sparklineData={[1200, 1500, 1800, 2100, 2400, 2840]}
            />
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="ProgressCard — value vs target"
          code={`<ProgressCard
  label="Sales Target"
  value={72000}
  target={100000}
  unit="$"
/>
<ProgressCard
  label="New Users"
  value={840}
  target={1000}
/>`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ProgressCard
              label="Sales Target"
              value={72000}
              target={100000}
              unit="$"
            />
            <ProgressCard label="New Users" value={840} target={1000} />
          </div>
        </ShowcaseExample>

        <ShowcaseExample
          title="ActivityFeed — timestamped event list"
          code={`<ActivityFeed
  items={[
    {
      id: "1",
      user: { name: "Alice Johnson" },
      action: "placed a new order #1042",
      timestamp: "2 minutes ago",
    },
    // ...
  ]}
  title="Recent Activity"
/>`}
        >
          <ActivityFeed items={activityItems} title="Recent Activity" />
        </ShowcaseExample>

        <ShowcaseExample
          title="Metric comparison — period-over-period with badges"
          code={`<Card>
  <CardHeader>
    <CardTitle>Period Comparison</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-xs text-muted-foreground">This Month</p>
        <p className="text-xl font-semibold">$12,450</p>
      </div>
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
        <TrendingUp className="mr-1 h-3 w-3" />
        +22%
      </Badge>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Last Month</p>
        <p className="text-xl font-semibold">$10,200</p>
      </div>
    </div>
    <Separator />
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-xs text-muted-foreground">Orders</p>
        <p className="text-xl font-semibold">342</p>
      </div>
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0">
        <TrendingUp className="mr-1 h-3 w-3" />
        +14.7%
      </Badge>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Last Month</p>
        <p className="text-xl font-semibold">298</p>
      </div>
    </div>
  </CardContent>
</Card>`}
        >
          <Card>
            <CardHeader>
              <CardTitle>Period Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-muted-foreground text-xs">This Month</p>
                  <p className="text-xl font-semibold">$12,450</p>
                </div>
                <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +22%
                </Badge>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Last Month</p>
                  <p className="text-xl font-semibold">$10,200</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-muted-foreground text-xs">Orders</p>
                  <p className="text-xl font-semibold">342</p>
                </div>
                <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +14.7%
                </Badge>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs">Last Month</p>
                  <p className="text-xl font-semibold">298</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </ShowcaseExample>

        <ShowcaseExample
          title="Compact stat row — inline metrics in a single card"
          code={`<Card>
  <CardContent className="flex items-center divide-x py-4">
    <div className="px-4 first:pl-0 last:pr-0">
      <p className="text-xs text-muted-foreground">Revenue</p>
      <p className="text-sm font-medium">$12.4k</p>
    </div>
    {/* ... */}
  </CardContent>
</Card>`}
        >
          <Card>
            <CardContent className="flex items-center divide-x py-4">
              {[
                { label: "Revenue", value: "$12.4k" },
                { label: "Orders", value: "342" },
                { label: "Customers", value: "89" },
                { label: "AOV", value: "$36.20" },
                { label: "Conversion", value: "3.2%" },
              ].map((metric) => (
                <div key={metric.label} className="px-4 first:pl-0 last:pr-0">
                  <p className="text-muted-foreground text-xs">
                    {metric.label}
                  </p>
                  <p className="text-sm font-medium">{metric.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </ShowcaseExample>

        <ShowcaseExample
          title="Grid layout variations — 2, 3, and 4 column MetricGrid"
          code={`<MetricGrid columns={2}>
  <StatCard label="Revenue" value="$34,200" icon={DollarSign} />
  <StatCard label="Orders" value="1,240" icon={ShoppingCart} />
</MetricGrid>
<MetricGrid columns={3}>...</MetricGrid>
<MetricGrid columns={4}>...</MetricGrid>`}
        >
          <div className="space-y-4">
            <p className="text-muted-foreground text-xs">2 columns</p>
            <MetricGrid columns={2}>
              <StatCard label="Revenue" value="$34,200" icon={DollarSign} />
              <StatCard label="Orders" value="1,240" icon={ShoppingCart} />
            </MetricGrid>

            <p className="text-muted-foreground text-xs">3 columns</p>
            <MetricGrid columns={3}>
              <StatCard label="Revenue" value="$34,200" icon={DollarSign} />
              <StatCard label="Orders" value="1,240" icon={ShoppingCart} />
              <StatCard label="Customers" value="8,340" icon={Users} />
            </MetricGrid>

            <p className="text-muted-foreground text-xs">4 columns</p>
            <MetricGrid columns={4}>
              <StatCard label="Revenue" value="$34,200" icon={DollarSign} />
              <StatCard label="Orders" value="1,240" icon={ShoppingCart} />
              <StatCard label="Customers" value="8,340" icon={Users} />
              <StatCard label="Growth" value="+22%" icon={TrendingUp} />
            </MetricGrid>
          </div>
        </ShowcaseExample>
      </div>
    </div>
  )
}

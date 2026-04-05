import { createFileRoute } from "@tanstack/react-router"
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react"
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
      </div>
    </div>
  )
}

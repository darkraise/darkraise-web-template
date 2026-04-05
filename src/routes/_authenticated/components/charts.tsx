import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  ChartCard,
} from "@/features/charts"
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
      </div>
    </div>
  )
}

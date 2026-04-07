import type { AnalyticsDataPoint } from "@/demo/types"

function generateAnalyticsData(): AnalyticsDataPoint[] {
  const data: AnalyticsDataPoint[] = []
  const baseDate = new Date("2026-03-04")

  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + i)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const weekendMultiplier = isWeekend ? 1.3 : 1
    const trendMultiplier = 1 + i * 0.008

    const baseRevenue = 3200 + Math.sin(i * 0.5) * 800
    const revenue = Math.round(
      baseRevenue * weekendMultiplier * trendMultiplier,
    )
    const baseOrders = 18 + Math.sin(i * 0.4) * 6
    const orders = Math.round(baseOrders * weekendMultiplier * trendMultiplier)
    const baseVisitors = 520 + Math.sin(i * 0.3) * 150
    const visitors = Math.round(
      baseVisitors * weekendMultiplier * trendMultiplier,
    )
    const conversion = Number(((orders / visitors) * 100).toFixed(1))

    data.push({
      date: date.toISOString().split("T")[0] ?? "",
      revenue,
      orders,
      visitors,
      conversion,
    })
  }

  return data
}

export const analytics: AnalyticsDataPoint[] = generateAnalyticsData()

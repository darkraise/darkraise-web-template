import { createFileRoute } from "@tanstack/react-router"
import { ContributionGraph } from "darkraise-ui/components/contribution-graph"
import { useMemo, useState } from "react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/contribution-graph",
)({
  component: ContributionGraphPage,
})

const END_DATE = "2026-07-24"
const START_DATE = "2025-07-25"

/** Deterministic sample series: a seeded generator keeps the demo stable
 *  across reloads instead of reshuffling on every render. */
function sampleData() {
  const data: { date: string; value: number }[] = []
  const start = new Date(2025, 6, 25)
  let seed = 42
  for (let offset = 0; offset <= 364; offset++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    const value = seed % 11
    if (value > 2) {
      const day = new Date(start)
      day.setDate(day.getDate() + offset)
      const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
      data.push({ date: key, value: value - 2 })
    }
  }
  return data
}

const defaultCode = `<ContributionGraph
  startDate="2025-07-25"
  endDate="2026-07-24"
  data={[{ date: "2026-07-01", value: 4 }]}
/>`

const mondayCode = `<ContributionGraph
  startDate="2025-07-25"
  endDate="2026-07-24"
  data={data}
  weekStartsOn={1}
/>`

const minimalCode = `<ContributionGraph
  startDate="2025-07-25"
  endDate="2026-07-24"
  data={data}
  showLegend={false}
  showMonthLabels={false}
  showWeekdayLabels={false}
/>`

const clickableCode = `<ContributionGraph
  startDate="2025-07-25"
  endDate="2026-07-24"
  data={data}
  onCellClick={(cell) => setSelected(\`\${cell.key}: \${cell.value}\`)}
/>`

function ContributionGraphPage() {
  const data = useMemo(() => sampleData(), [])
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <ShowcasePage
      title="Contribution Graph"
      description="Calendar heatmap of daily activity, with month labels, a legend, tooltips, and keyboard navigation."
    >
      <ShowcaseExample title="Default" code={defaultCode}>
        <div className="overflow-x-auto">
          <ContributionGraph
            startDate={START_DATE}
            endDate={END_DATE}
            data={data}
          />
        </div>
      </ShowcaseExample>

      <ShowcaseExample title="Week starts on Monday" code={mondayCode}>
        <div className="overflow-x-auto">
          <ContributionGraph
            startDate={START_DATE}
            endDate={END_DATE}
            data={data}
            weekStartsOn={1}
          />
        </div>
      </ShowcaseExample>

      <ShowcaseExample title="Grid only" code={minimalCode}>
        <div className="overflow-x-auto">
          <ContributionGraph
            startDate={START_DATE}
            endDate={END_DATE}
            data={data}
            showLegend={false}
            showMonthLabels={false}
            showWeekdayLabels={false}
          />
        </div>
      </ShowcaseExample>

      <ShowcaseExample title="Clickable cells" code={clickableCode}>
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <ContributionGraph
              startDate={START_DATE}
              endDate={END_DATE}
              data={data}
              onCellClick={(cell) => setSelected(`${cell.key}: ${cell.value}`)}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            {selected ?? "Click or focus a day and press Enter."}
          </p>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

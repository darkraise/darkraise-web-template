import { createFileRoute } from "@tanstack/react-router"
import {
  Stat,
  StatChange,
  StatLabel,
  StatValue,
} from "darkraise-ui/components/stat"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/stat")({
  component: StatPage,
})

function StatPage() {
  return (
    <ShowcasePage
      title="Stat"
      description="KPI block — a labelled metric value with an optional change indicator. Usually shown in a grid to compare a few headline numbers at a glance."
    >
      <ShowcaseExample
        title="Single stat"
        code={`<Stat>
  <StatLabel>Revenue</StatLabel>
  <StatValue>$45,231</StatValue>
  <StatChange direction="up">+12.5%</StatChange>
</Stat>`}
      >
        <Stat>
          <StatLabel>Revenue</StatLabel>
          <StatValue>$45,231</StatValue>
          <StatChange direction="up">+12.5%</StatChange>
        </Stat>
      </ShowcaseExample>

      <ShowcaseExample
        title="Grid of stats"
        code={`<div className="grid gap-4 sm:grid-cols-3">
  <Stat>
    <StatLabel>Revenue</StatLabel>
    <StatValue>$45,231</StatValue>
    <StatChange direction="up">+12.5%</StatChange>
  </Stat>
  <Stat>
    <StatLabel>Active Users</StatLabel>
    <StatValue>1,284</StatValue>
    <StatChange direction="up">+3.1%</StatChange>
  </Stat>
  <Stat>
    <StatLabel>Conversion</StatLabel>
    <StatValue>4.7%</StatValue>
    <StatChange direction="down">−0.4%</StatChange>
  </Stat>
</div>`}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat>
            <StatLabel>Revenue</StatLabel>
            <StatValue>$45,231</StatValue>
            <StatChange direction="up">+12.5%</StatChange>
          </Stat>
          <Stat>
            <StatLabel>Active Users</StatLabel>
            <StatValue>1,284</StatValue>
            <StatChange direction="up">+3.1%</StatChange>
          </Stat>
          <Stat>
            <StatLabel>Conversion</StatLabel>
            <StatValue>4.7%</StatValue>
            <StatChange direction="down">−0.4%</StatChange>
          </Stat>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

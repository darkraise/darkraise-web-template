import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  CascadeSelect,
  type CascadeOption,
} from "darkraise-ui/components/cascade-select"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/cascade-select",
)({
  component: CascadeSelectPage,
})

const REGIONS: CascadeOption[] = [
  {
    value: "us",
    label: "United States",
    children: [
      { value: "ca", label: "California" },
      { value: "ny", label: "New York" },
      { value: "tx", label: "Texas" },
      { value: "wa", label: "Washington" },
    ],
  },
  {
    value: "ca",
    label: "Canada",
    children: [
      { value: "on", label: "Ontario" },
      { value: "qc", label: "Quebec" },
      { value: "bc", label: "British Columbia" },
      { value: "ab", label: "Alberta" },
    ],
  },
]

const ORG: CascadeOption[] = [
  {
    value: "engineering",
    label: "Engineering",
    children: [
      {
        value: "platform",
        label: "Platform",
        children: [
          { value: "ada", label: "Ada Lovelace" },
          { value: "linus", label: "Linus Torvalds" },
        ],
      },
      {
        value: "frontend",
        label: "Frontend",
        children: [
          { value: "evan", label: "Evan You" },
          { value: "rich", label: "Rich Harris" },
        ],
      },
    ],
  },
  {
    value: "design",
    label: "Design",
    children: [
      {
        value: "product",
        label: "Product",
        children: [
          { value: "dieter", label: "Dieter Rams" },
          { value: "jony", label: "Jony Ive" },
        ],
      },
    ],
  },
]

const REGIONS_WITH_DISABLED: CascadeOption[] = REGIONS.map((region, i) =>
  i === 1 ? { ...region, disabled: true } : region,
)

function CascadeSelectPage() {
  const [region, setRegion] = useState<string[]>([])
  const [member, setMember] = useState<string[]>([])
  const [restricted, setRestricted] = useState<string[]>([])

  return (
    <ShowcasePage
      title="Cascade Select"
      description="A column-based picker for choosing a value from a hierarchy of options. Hovering a parent reveals its children in the next column."
    >
      <ShowcaseExample
        title="Country and state"
        code={`const [path, setPath] = useState<string[]>([])

<CascadeSelect
  options={REGIONS}
  value={path}
  onValueChange={setPath}
  placeholder="Pick a region"
/>`}
      >
        <div className="space-y-2">
          <CascadeSelect
            options={REGIONS}
            value={region}
            onValueChange={setRegion}
            placeholder="Pick a region"
          />
          <p className="text-muted-foreground text-xs">
            Path:{" "}
            <span className="font-medium">
              {region.length > 0 ? region.join(" / ") : "(none)"}
            </span>
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Three-level cascade"
        code={`<CascadeSelect
  options={ORG}
  value={path}
  onValueChange={setPath}
  placeholder="Find a teammate"
/>`}
      >
        <div className="space-y-2">
          <CascadeSelect
            options={ORG}
            value={member}
            onValueChange={setMember}
            placeholder="Find a teammate"
          />
          <p className="text-muted-foreground text-xs">
            Path:{" "}
            <span className="font-medium">
              {member.length > 0 ? member.join(" / ") : "(none)"}
            </span>
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="With a disabled branch"
        code={`const REGIONS_WITH_DISABLED = [
  REGIONS[0],
  { ...REGIONS[1], disabled: true },
]

<CascadeSelect
  options={REGIONS_WITH_DISABLED}
  value={path}
  onValueChange={setPath}
  placeholder="Pick a region (Canada disabled)"
/>`}
      >
        <CascadeSelect
          options={REGIONS_WITH_DISABLED}
          value={restricted}
          onValueChange={setRestricted}
          placeholder="Pick a region (Canada disabled)"
        />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

import type { MouseEvent, ReactNode } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Bold } from "lucide-react"
import { Badge } from "darkraise-ui/components/badge"
import { Button } from "darkraise-ui/components/button"
import type { ButtonVariant } from "darkraise-ui/components/button"
import { Card } from "darkraise-ui/components/card"
import type { CardElevation } from "darkraise-ui/components/card"
import { Checkbox } from "darkraise-ui/components/checkbox"
import { Input } from "darkraise-ui/components/input"
import { Label } from "darkraise-ui/components/label"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "darkraise-ui/components/pagination"
import { RadioGroup, RadioGroupItem } from "darkraise-ui/components/radio-group"
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
} from "darkraise-ui/components/segment-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "darkraise-ui/components/select"
import { Slider } from "darkraise-ui/components/slider"
import { Switch } from "darkraise-ui/components/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "darkraise-ui/components/tabs"
import { Textarea } from "darkraise-ui/components/textarea"
import { Toggle } from "darkraise-ui/components/toggle"
import { useAppTranslation } from "@/i18n/useAppTranslation"
import { allOf } from "./_components/-variant-axes"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/kitchen-sink")(
  {
    component: KitchenSinkPage,
  },
)

// `link` is left out on purpose: it draws no control surface to compare.
const BUTTONS: { variant: ButtonVariant; label: string }[] = [
  { variant: "default", label: "Default" },
  { variant: "destructive", label: "Destructive" },
  { variant: "outline", label: "Outline" },
  { variant: "secondary", label: "Secondary" },
  { variant: "ghost", label: "Ghost" },
]

const CARD_ELEVATIONS = allOf<CardElevation>()("flat", "low", "medium", "high")

const ELEVATION_LABELS: Record<CardElevation, string> = {
  flat: "Flat",
  low: "Low",
  medium: "Medium",
  high: "High",
}

const PERIODS = [
  { value: "day", label: "Day", panel: "Daily view" },
  { value: "week", label: "Week", panel: "Weekly view" },
  { value: "month", label: "Month", panel: "Monthly view" },
]

const FAMILY_LABEL =
  "text-muted-foreground text-xs font-medium tracking-wide uppercase"

function stay(event: MouseEvent) {
  event.preventDefault()
}

function Family({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  const t = useAppTranslation()
  return (
    <Card data-family={id} className="min-w-0 space-y-3 p-4">
      <p className={FAMILY_LABEL}>{t(title)}</p>
      {children}
    </Card>
  )
}

function KitchenSinkPage() {
  const t = useAppTranslation()

  return (
    <ShowcasePage
      title={t("Kitchen Sink")}
      description="Every control family at rest in one viewport, the reference for comparing styles."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Family id="buttons" title="Button variants">
          <div className="flex flex-wrap gap-2">
            {BUTTONS.map(({ variant, label }) => (
              <Button key={variant} variant={variant}>
                {t(label)}
              </Button>
            ))}
          </div>
        </Family>

        <Family id="fields" title="Fields">
          <div className="space-y-2">
            <Input aria-label={t("Text field")} placeholder={t("Text field")} />
            <Input
              aria-label={t("Focused field")}
              placeholder={t("Focused field")}
              autoFocus
            />
            <Select>
              <SelectTrigger aria-label={t("Choose a plan")}>
                <SelectValue placeholder={t("Choose a plan")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">{t("Starter")}</SelectItem>
                <SelectItem value="pro">{t("Pro")}</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              aria-label={t("Write a note")}
              placeholder={t("Write a note")}
              rows={2}
            />
          </div>
        </Family>

        <Family id="choices" title="Choices">
          <div className="grid grid-cols-2 gap-x-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="kitchen-sink-checkbox-on" defaultChecked />
                <Label htmlFor="kitchen-sink-checkbox-on">{t("Checked")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="kitchen-sink-checkbox-off" />
                <Label htmlFor="kitchen-sink-checkbox-off">
                  {t("Unchecked")}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="kitchen-sink-switch-on" defaultChecked />
                <Label htmlFor="kitchen-sink-switch-on">{t("On")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="kitchen-sink-switch-off" />
                <Label htmlFor="kitchen-sink-switch-off">{t("Off")}</Label>
              </div>
            </div>
            <RadioGroup defaultValue="on" aria-label={t("Choices")}>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="on" id="kitchen-sink-radio-on" />
                <Label htmlFor="kitchen-sink-radio-on">{t("Checked")}</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="off" id="kitchen-sink-radio-off" />
                <Label htmlFor="kitchen-sink-radio-off">{t("Unchecked")}</Label>
              </div>
            </RadioGroup>
          </div>
        </Family>

        <Family id="slider-toggle" title="Slider and toggle">
          <Slider
            aria-label={t("Volume")}
            defaultValue={[40]}
            min={0}
            max={100}
            step={1}
          />
          <Toggle aria-label={t("Bold")} defaultPressed>
            <Bold className="h-4 w-4" />
          </Toggle>
        </Family>

        <Family id="tabs-segments" title="Tabs and segments">
          <Tabs defaultValue="day">
            <TabsList>
              {PERIODS.map(({ value, label }) => (
                <TabsTrigger key={value} value={value}>
                  {t(label)}
                </TabsTrigger>
              ))}
            </TabsList>
            {PERIODS.map(({ value, panel }) => (
              <TabsContent key={value} value={value}>
                <p className="text-muted-foreground text-sm">{t(panel)}</p>
              </TabsContent>
            ))}
          </Tabs>
          <SegmentGroup defaultValue="week" aria-label={t("Tabs and segments")}>
            <SegmentGroupIndicator />
            {PERIODS.map(({ value, label }) => (
              <SegmentGroupItem key={value} value={value}>
                {t(label)}
              </SegmentGroupItem>
            ))}
          </SegmentGroup>
        </Family>

        <Family id="badges-pagination" title="Badges and pagination">
          <div className="flex gap-2">
            <Badge>{t("Default")}</Badge>
            <Badge variant="outline">{t("Outline")}</Badge>
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={stay} />
              </PaginationItem>
              {[1, 2, 3].map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink href="#" isActive={page === 2} onClick={stay}>
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={stay} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Family>
      </div>

      <section data-family="cards" className="space-y-3">
        <p className={FAMILY_LABEL}>{t("Card elevations")}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <Card elevation className="min-w-0 p-4">
            <p className="text-sm font-medium">{t("Auto")}</p>
            <p className="text-muted-foreground font-mono text-xs">elevation</p>
          </Card>
          {CARD_ELEVATIONS.map((elevation) => (
            <Card key={elevation} elevation={elevation} className="min-w-0 p-4">
              <p className="text-sm font-medium">
                {t(ELEVATION_LABELS[elevation])}
              </p>
              <p className="text-muted-foreground font-mono text-xs">
                elevation="{elevation}"
              </p>
            </Card>
          ))}
        </div>
      </section>
    </ShowcasePage>
  )
}

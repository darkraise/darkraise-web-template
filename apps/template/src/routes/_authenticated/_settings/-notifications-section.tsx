import { useState } from "react"
import { Card, CardContent } from "darkraise-ui/components/card"
import { Checkbox } from "darkraise-ui/components/checkbox"
import { Label } from "darkraise-ui/components/label"
import { RadioGroup, RadioGroupItem } from "darkraise-ui/components/radio-group"
import { Switch } from "darkraise-ui/components/switch"
import { FormSection } from "darkraise-ui/forms"

const EVENT_OPTIONS = [
  { id: "new-orders", label: "New orders" },
  { id: "product-updates", label: "Product updates" },
  { id: "security-alerts", label: "Security alerts" },
  { id: "team-mentions", label: "Team mentions" },
] as const

type EventId = (typeof EVENT_OPTIONS)[number]["id"]

const DIGEST_OPTIONS = [
  { label: "Real-time", value: "realtime" },
  { label: "Daily digest", value: "daily" },
  { label: "Weekly summary", value: "weekly" },
] as const

export function NotificationsSection() {
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [events, setEvents] = useState<Record<EventId, boolean>>({
    "new-orders": true,
    "product-updates": true,
    "security-alerts": true,
    "team-mentions": false,
  })
  const [digestFrequency, setDigestFrequency] = useState("daily")

  return (
    <FormSection
      title="Notifications"
      description="Choose how and when you want to be notified."
    >
      <Card>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="notif-email"
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
              />
              <Label htmlFor="notif-email">Email notifications</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="notif-push"
                checked={pushEnabled}
                onCheckedChange={setPushEnabled}
              />
              <Label htmlFor="notif-push">Push notifications</Label>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-medium">Notify me about</p>
            {EVENT_OPTIONS.map((event) => (
              <div key={event.id} className="flex items-center gap-2">
                <Checkbox
                  id={`notif-event-${event.id}`}
                  checked={events[event.id]}
                  onCheckedChange={(checked) =>
                    setEvents((prev) => ({
                      ...prev,
                      [event.id]: checked === true,
                    }))
                  }
                />
                <Label htmlFor={`notif-event-${event.id}`}>{event.label}</Label>
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <p className="text-sm font-medium">Digest frequency</p>
            <RadioGroup
              value={digestFrequency}
              onValueChange={setDigestFrequency}
            >
              {DIGEST_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`notif-digest-${option.value}`}
                  />
                  <Label htmlFor={`notif-digest-${option.value}`}>
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </FormSection>
  )
}

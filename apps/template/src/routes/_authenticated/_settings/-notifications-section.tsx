import { useId, useState } from "react"
import { Card, CardContent } from "darkraise-ui/components/card"
import { Checkbox } from "darkraise-ui/components/checkbox"
import { Label } from "darkraise-ui/components/label"
import { Switch } from "darkraise-ui/components/switch"
import { FormSection } from "darkraise-ui/forms"

const CHANNEL_OPTIONS = [
  { id: "push", label: "Push notifications" },
  { id: "in-app", label: "In-app notifications" },
  { id: "sms", label: "SMS" },
] as const

type ChannelId = (typeof CHANNEL_OPTIONS)[number]["id"]

const EVENT_OPTIONS = [
  { id: "new-orders", label: "New orders" },
  { id: "product-updates", label: "Product updates" },
  { id: "security-alerts", label: "Security alerts" },
  { id: "team-mentions", label: "Team mentions" },
] as const

type EventId = (typeof EVENT_OPTIONS)[number]["id"]

export function NotificationsSection() {
  const channelsHeadingId = useId()
  const eventsHeadingId = useId()
  const [channels, setChannels] = useState<Record<ChannelId, boolean>>({
    push: false,
    "in-app": true,
    sms: false,
  })
  const [events, setEvents] = useState<Record<EventId, boolean>>({
    "new-orders": true,
    "product-updates": true,
    "security-alerts": true,
    "team-mentions": false,
  })

  return (
    <FormSection
      title="Notification channels"
      description="Email and digest frequency are managed above — choose which other channels reach you and which events they cover."
    >
      <Card>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-2.5">
            <p id={channelsHeadingId} className="text-sm font-medium">
              Channels
            </p>
            <div
              role="group"
              aria-labelledby={channelsHeadingId}
              className="space-y-2.5"
            >
              {CHANNEL_OPTIONS.map((channel) => (
                <div key={channel.id} className="flex items-center gap-3">
                  <Switch
                    id={`notif-channel-${channel.id}`}
                    checked={channels[channel.id]}
                    onCheckedChange={(checked) =>
                      setChannels((prev) => ({
                        ...prev,
                        [channel.id]: checked,
                      }))
                    }
                  />
                  <Label htmlFor={`notif-channel-${channel.id}`}>
                    {channel.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <p id={eventsHeadingId} className="text-sm font-medium">
              Notify me about
            </p>
            <div
              role="group"
              aria-labelledby={eventsHeadingId}
              className="space-y-2.5"
            >
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
                  <Label htmlFor={`notif-event-${event.id}`}>
                    {event.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </FormSection>
  )
}

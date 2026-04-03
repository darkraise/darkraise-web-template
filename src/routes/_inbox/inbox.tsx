import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { SplitPanelLayout } from "@/core/layout"
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { cn } from "@/core/lib/utils"
import { useMessages, useMarkMessageAsRead } from "@/demo/hooks"
import { inboxNav } from "@/routes/_inbox"

export const Route = createFileRoute("/_inbox/inbox")({
  component: InboxPage,
})

function InboxPage() {
  const { data: messages } = useMessages()
  const markAsRead = useMarkMessageAsRead()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedMessage = messages?.find((m) => m.id === selectedId) ?? null

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const message = messages?.find((m) => m.id === id)
    if (message && !message.isRead) {
      markAsRead.mutate(id)
    }
  }

  const panel = (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {messages?.map((message) => (
          <button
            key={message.id}
            onClick={() => handleSelect(message.id)}
            className={cn(
              "w-full px-4 py-3 text-left transition-colors hover:bg-accent",
              selectedId === message.id && "bg-accent",
              !message.isRead && "bg-accent/50",
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {message.from.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      !message.isRead && "font-semibold",
                    )}
                  >
                    {message.from.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(message.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-sm",
                    !message.isRead
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {message.subject}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {message.body.slice(0, 80)}...
                </p>
              </div>
              {!message.isRead && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )

  return (
    <SplitPanelLayout nav={inboxNav} panel={panel}>
      {selectedMessage ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-medium">{selectedMessage.subject}</h1>
            <div className="mt-2 flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {selectedMessage.from.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {selectedMessage.from.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedMessage.from.email} &middot;{" "}
                  {new Date(selectedMessage.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {selectedMessage.body}
          </div>
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">Select a message to read it</p>
        </div>
      )}
    </SplitPanelLayout>
  )
}

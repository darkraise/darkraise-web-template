"use client"

import * as React from "react"

import { cn } from "@lib/utils"
import "./timeline.css"

export type TimelineVariant = "default" | "alternating"
export type TimelineItemStatus = "complete" | "current" | "upcoming"
export type TimelineItemSide = "start" | "end"
export type TimelineConnectorVariant = "solid" | "dashed"

/** Announced by screen readers so status is never conveyed by colour alone. */
const STATUS_TEXT: Record<TimelineItemStatus, string> = {
  complete: "Completed",
  current: "Current",
  upcoming: "Upcoming",
}

interface TimelineContextValue {
  variant: TimelineVariant
}

const TimelineContext = React.createContext<TimelineContextValue | null>(null)

function useTimelineContext(part: string): TimelineContextValue {
  const ctx = React.useContext(TimelineContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <Timeline> root component`)
  }
  return ctx
}

interface TimelineItemContextValue {
  status?: TimelineItemStatus
}

const TimelineItemContext =
  React.createContext<TimelineItemContextValue | null>(null)

function useTimelineItemContext(part: string): TimelineItemContextValue {
  const ctx = React.useContext(TimelineItemContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <TimelineItem>`)
  }
  return ctx
}

export interface TimelineProps extends React.HTMLAttributes<HTMLOListElement> {
  variant?: TimelineVariant
}

function Timeline({
  className,
  variant = "default",
  children,
  ...props
}: TimelineProps) {
  const ctx = React.useMemo<TimelineContextValue>(
    () => ({ variant }),
    [variant],
  )
  return (
    <ol
      className={cn("dr-timeline", className)}
      data-variant={variant}
      {...props}
    >
      <TimelineContext.Provider value={ctx}>
        {children}
      </TimelineContext.Provider>
    </ol>
  )
}

export interface TimelineItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  status?: TimelineItemStatus
  /**
   * Overrides alternating placement. "start" pins the content to the first
   * column, "end" to the last. Ignored by the default variant.
   */
  side?: TimelineItemSide
}

function TimelineItem({
  className,
  status,
  side,
  children,
  ...props
}: TimelineItemProps) {
  const { variant } = useTimelineContext("TimelineItem")
  const ctx = React.useMemo<TimelineItemContextValue>(
    () => ({ status }),
    [status],
  )
  return (
    <li
      className={cn("dr-timeline-item", className)}
      data-variant={variant}
      data-status={status}
      data-side={side}
      aria-current={status === "current" ? "step" : undefined}
      {...props}
    >
      <TimelineItemContext.Provider value={ctx}>
        {children}
        {status ? (
          <span className="dr-timeline-status-text">{STATUS_TEXT[status]}</span>
        ) : null}
      </TimelineItemContext.Provider>
    </li>
  )
}

export type TimelineIndicatorProps = React.HTMLAttributes<HTMLSpanElement>

function TimelineIndicator({ className, ...props }: TimelineIndicatorProps) {
  const { status } = useTimelineItemContext("TimelineIndicator")
  return (
    <span
      aria-hidden="true"
      data-status={status}
      className={cn("dr-timeline-indicator", className)}
      {...props}
    />
  )
}

export interface TimelineConnectorProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TimelineConnectorVariant
}

function TimelineConnector({
  className,
  variant = "solid",
  ...props
}: TimelineConnectorProps) {
  const { status } = useTimelineItemContext("TimelineConnector")
  return (
    <span
      aria-hidden="true"
      data-status={status}
      data-variant={variant}
      className={cn("dr-timeline-connector", className)}
      {...props}
    />
  )
}

export type TimelineContentProps = React.HTMLAttributes<HTMLDivElement>

function TimelineContent({ className, ...props }: TimelineContentProps) {
  const { status } = useTimelineItemContext("TimelineContent")
  return (
    <div
      data-status={status}
      className={cn("dr-timeline-content", className)}
      {...props}
    />
  )
}

export type TimelineTitleProps = React.HTMLAttributes<HTMLSpanElement>

function TimelineTitle({ className, ...props }: TimelineTitleProps) {
  const { status } = useTimelineItemContext("TimelineTitle")
  return (
    <span
      data-status={status}
      className={cn("dr-timeline-title", className)}
      {...props}
    />
  )
}

export type TimelineDescriptionProps =
  React.HTMLAttributes<HTMLParagraphElement>

function TimelineDescription({
  className,
  ...props
}: TimelineDescriptionProps) {
  const { status } = useTimelineItemContext("TimelineDescription")
  return (
    <p
      data-status={status}
      className={cn("dr-timeline-description", className)}
      {...props}
    />
  )
}

export type TimelineTimeProps = React.TimeHTMLAttributes<HTMLTimeElement>

function TimelineTime({ className, ...props }: TimelineTimeProps) {
  return <time className={cn("dr-timeline-time", className)} {...props} />
}

export type TimelineMetaProps = React.HTMLAttributes<HTMLDivElement>

function TimelineMeta({ className, ...props }: TimelineMetaProps) {
  useTimelineItemContext("TimelineMeta")
  return <div className={cn("dr-timeline-meta", className)} {...props} />
}

export {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineConnector,
  TimelineContent,
  TimelineTitle,
  TimelineDescription,
  TimelineTime,
  TimelineMeta,
}

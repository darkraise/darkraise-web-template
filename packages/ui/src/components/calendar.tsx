import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayButton, DayPicker } from "react-day-picker"

import { cn } from "../lib/utils"
import { Button, buttonVariants } from "./button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("glass bg-card p-3", className)}
      captionLayout={captionLayout}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4 md:flex-row",
        month: "flex w-full flex-col gap-4",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 select-none p-0 aria-disabled:opacity-50",
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-8 w-8 select-none p-0 aria-disabled:opacity-50",
        ),
        month_caption: "flex h-8 w-full items-center justify-center px-8",
        caption_label: cn(
          "select-none text-sm font-medium",
          captionLayout !== "label" &&
            "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 [&>svg]:size-3.5",
        ),
        dropdowns:
          "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
        dropdown_root:
          "has-focus:border-ring border-input has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border shadow-xs",
        dropdown: "bg-popover absolute inset-0 opacity-0",
        table: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground w-8 select-none rounded-md text-[0.8rem] font-normal text-center",
        week: "mt-2 flex w-full",
        week_number_header: "w-8 select-none",
        week_number: "text-muted-foreground select-none text-[0.8rem]",
        day: "relative h-8 w-8 select-none p-0 text-center",
        range_start: "bg-accent rounded-l-md",
        range_middle: "rounded-none",
        range_end: "bg-accent rounded-r-md",
        today:
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
        outside:
          "text-muted-foreground aria-selected:text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),
        Chevron: ({ className, orientation, ...props }) => {
          const Icon =
            orientation === "left" ? ChevronLeftIcon : ChevronRightIcon
          return <Icon className={cn("size-4", className)} {...props} />
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex size-8 items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex h-8 w-8 flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md [&>span]:text-xs [&>span]:opacity-70",
        className,
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }

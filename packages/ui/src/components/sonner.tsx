"use client"

import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "hsl(var(--popover))",
          "--normal-text": "hsl(var(--popover-foreground))",
          "--normal-border": "hsl(var(--border))",
        } as React.CSSProperties
      }
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg glass-strong",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "!border-green-500/40 !text-green-600 dark:!text-green-400 [&_[data-description]]:!text-green-600/80 dark:[&_[data-description]]:!text-green-400/80",
          error:
            "!border-destructive/40 !text-destructive [&_[data-description]]:!text-destructive/80",
          warning:
            "!border-amber-500/40 !text-amber-600 dark:!text-amber-400 [&_[data-description]]:!text-amber-600/80 dark:[&_[data-description]]:!text-amber-400/80",
          info: "!border-blue-500/40 !text-blue-600 dark:!text-blue-400 [&_[data-description]]:!text-blue-600/80 dark:[&_[data-description]]:!text-blue-400/80",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

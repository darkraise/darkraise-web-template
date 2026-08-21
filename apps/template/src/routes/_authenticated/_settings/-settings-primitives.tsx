import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "darkraise-ui/components/card"

interface SettingsCardProps {
  icon: ReactNode
  title: string
  /** Rendered at the far right of the title row, level with the heading. */
  action?: ReactNode
  children: ReactNode
}

export function SettingsCard({
  icon,
  title,
  action,
  children,
}: SettingsCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-primary flex shrink-0 [&>svg]:size-5">
            {icon}
          </span>
          {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}

interface StatusPanelProps {
  title: string
  /** Short supporting lines, each usually an icon paired with a value. */
  meta?: ReactNode[]
  children?: ReactNode
}

/** Inset panel: a surface one rung above the card it sits in. */
export function StatusPanel({ title, meta, children }: StatusPanelProps) {
  return (
    <div className="bg-muted border-border rounded-lg border p-4">
      <p className="text-sm font-medium">{title}</p>
      {meta && meta.length > 0 && (
        <ul className="mt-2 space-y-1">
          {meta.map((line, i) => (
            <li
              key={i}
              className="text-muted-foreground flex items-center gap-1.5 text-xs [&>svg]:size-3.5"
            >
              {line}
            </li>
          ))}
        </ul>
      )}
      {children}
    </div>
  )
}

interface SettingRowProps {
  label: string
  description?: string
  /** The control itself — switch, button, badge. */
  control: ReactNode
}

export function SettingRow({ label, description, control }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

interface StatValueProps {
  label: string
  value: string
  /** Trailing marker beside the value, e.g. a status icon. */
  badge?: ReactNode
}

export function StatValue({ label, value, badge }: StatValueProps) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="flex items-center gap-2 text-xl font-semibold">
        {value}
        {badge}
      </p>
    </div>
  )
}

import { TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent } from "darkraise-ui/components/card"
import { cn } from "darkraise-ui/lib"
import type { StatCardProps } from "../../types"

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-px hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">{label}</p>
          {Icon && <Icon className="text-muted-foreground h-4 w-4" />}
        </div>
        <p className="mt-2 text-2xl font-medium">{value}</p>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trend.isPositive ? (
              <TrendingUp className="text-success h-3 w-3" />
            ) : (
              <TrendingDown className="text-destructive h-3 w-3" />
            )}
            <span
              className={cn(
                trend.isPositive ? "text-success" : "text-destructive",
              )}
            >
              {trend.value}%
            </span>
            <span className="text-muted-foreground">from last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

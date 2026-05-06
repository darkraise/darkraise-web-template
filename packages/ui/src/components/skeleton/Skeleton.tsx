import { cn } from "@lib/utils"
import "./skeleton.css"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dr-skeleton", className)} {...props} />
}

export { Skeleton }

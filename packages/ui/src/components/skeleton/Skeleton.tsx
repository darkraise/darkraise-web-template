import { cn } from "@lib/utils"
import "./skeleton.css"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // A skeleton stands in for content that is not there yet; exposing its
      // empty blocks to the accessibility tree announces nothing useful. The
      // loading state belongs on the region being filled, via aria-busy.
      aria-hidden="true"
      className={cn("dr-skeleton", className)}
      {...props}
    />
  )
}

export { Skeleton }

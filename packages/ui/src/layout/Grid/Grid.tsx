import { forwardRef, type HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const gridVariants = cva("grid", {
  variants: {
    cols: {
      1: "",
      2: "",
      3: "",
      4: "",
      6: "",
      12: "",
    },
    responsive: {
      true: "",
      false: "",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    },
  },
  compoundVariants: [
    { cols: 1, responsive: true, class: "grid-cols-1" },
    { cols: 2, responsive: true, class: "grid-cols-1 sm:grid-cols-2" },
    {
      cols: 3,
      responsive: true,
      class: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    },
    {
      cols: 4,
      responsive: true,
      class: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    },
    {
      cols: 6,
      responsive: true,
      class: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    },
    { cols: 12, responsive: true, class: "grid-cols-12" },
    { cols: 1, responsive: false, class: "grid-cols-1" },
    { cols: 2, responsive: false, class: "grid-cols-2" },
    { cols: 3, responsive: false, class: "grid-cols-3" },
    { cols: 4, responsive: false, class: "grid-cols-4" },
    { cols: 6, responsive: false, class: "grid-cols-6" },
    { cols: 12, responsive: false, class: "grid-cols-12" },
  ],
  defaultVariants: {
    cols: 1,
    gap: "md",
    responsive: true,
  },
})

export interface GridProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof gridVariants> {}

export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { className, cols, gap, responsive, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(gridVariants({ cols, gap, responsive }), className)}
      {...props}
    />
  )
})

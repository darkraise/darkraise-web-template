import type { Order } from "@/demo/types"

export type StepState = "complete" | "current" | "upcoming"

export const ORDER_STEPS = [
  "pending",
  "processing",
  "shipped",
  "delivered",
] as const

/** A delivered order has finished every step, so none of them is current. */
export function stepState(index: number, status: Order["status"]): StepState {
  if (status === "delivered") return "complete"
  const current = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number])
  if (current < 0 || index > current) return "upcoming"
  return index < current ? "complete" : "current"
}

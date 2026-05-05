import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "../../lib/utils"

function InputOTP({
  className,
  containerClassName,
  ref,
  ...props
}: React.ComponentProps<typeof OTPInput>) {
  return (
    <OTPInput
      ref={ref}
      containerClassName={cn(
        "flex items-center gap-2 has-[:disabled]:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}
InputOTP.displayName = "InputOTP"

function InputOTPGroup({
  className,
  ref,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div ref={ref} className={cn("flex items-center", className)} {...props} />
  )
}
InputOTPGroup.displayName = "InputOTPGroup"

function InputOTPSlot({
  index,
  className,
  ref,
  ...props
}: React.ComponentProps<"div"> & { index: number }) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const slot = inputOTPContext.slots[index]
  const char = slot?.char ?? null
  const hasFakeCaret = slot?.hasFakeCaret ?? false
  const isActive = slot?.isActive ?? false

  return (
    <div
      ref={ref}
      className={cn(
        "border-input relative flex aspect-square w-[var(--density-cell)] items-center justify-center border-y border-r text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "ring-ring ring-offset-background z-10 ring-1",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  )
}
InputOTPSlot.displayName = "InputOTPSlot"

function InputOTPSeparator({ ref, ...props }: React.ComponentProps<"div">) {
  return (
    <div ref={ref} role="separator" {...props}>
      <Dot />
    </div>
  )
}
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

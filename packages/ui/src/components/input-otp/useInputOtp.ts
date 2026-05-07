import { useControllableState, useEvent } from "@primitives/state"

export interface UseInputOtpOptions {
  maxLength: number
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onComplete?: (value: string) => void
  pattern?: string
}

export interface UseInputOtpReturn {
  value: string
  setValue: (next: string) => void
  isComplete: boolean
  applyChange: (next: string) => void
}

export function useInputOtp(options: UseInputOtpOptions): UseInputOtpReturn {
  const {
    maxLength,
    value: valueProp,
    defaultValue,
    onChange,
    onComplete,
    pattern,
  } = options

  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue: defaultValue ?? "",
    onChange,
  })

  const applyChange = useEvent((next: string) => {
    let normalized = next.replace(/\s/g, "")
    if (pattern) {
      const re = new RegExp(
        `^[${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]*$`,
      )
      if (!re.test(normalized)) return
    }
    if (normalized.length > maxLength) {
      normalized = normalized.slice(0, maxLength)
    }
    setValue(normalized)
    if (normalized.length === maxLength) {
      onComplete?.(normalized)
    }
  })

  return {
    value,
    setValue,
    isComplete: value.length === maxLength,
    applyChange,
  }
}

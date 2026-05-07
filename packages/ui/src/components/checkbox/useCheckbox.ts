import { useControllableState, useEvent } from "@primitives/state"

export type CheckedState = boolean | "indeterminate"

export interface UseCheckboxOptions {
  checked?: CheckedState
  defaultChecked?: CheckedState
  onCheckedChange?: (checked: CheckedState) => void
  disabled?: boolean
  required?: boolean
}

export interface UseCheckboxReturn {
  checked: CheckedState
  setChecked: (next: CheckedState) => void
  toggle: () => void
  state: "checked" | "unchecked" | "indeterminate"
  disabled: boolean
}

export function isIndeterminate(
  value: CheckedState | undefined,
): value is "indeterminate" {
  return value === "indeterminate"
}

export function useCheckbox(options: UseCheckboxOptions): UseCheckboxReturn {
  const {
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    disabled = false,
  } = options

  const [checked, setChecked] = useControllableState<CheckedState>({
    value: checkedProp,
    defaultValue: defaultChecked ?? false,
    onChange: onCheckedChange,
  })

  const toggle = useEvent(() => {
    if (disabled) return
    setChecked(isIndeterminate(checked) ? true : !checked)
  })

  const state = isIndeterminate(checked)
    ? ("indeterminate" as const)
    : checked
      ? ("checked" as const)
      : ("unchecked" as const)

  return { checked, setChecked, toggle, state, disabled }
}

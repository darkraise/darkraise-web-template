import type { ReactNode } from "react"
import { useUiLabels } from "../../labels"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../select"
import "./locale-switcher.css"

export interface LocaleSwitcherOption {
  locale: string
  label: string
  icon?: ReactNode
}

function OptionLabel({ option }: { option: LocaleSwitcherOption }) {
  return (
    <span className="dr-locale-option">
      {option.icon != null && (
        <span className="dr-locale-option-icon" aria-hidden="true">
          {option.icon}
        </span>
      )}
      <span>{option.label}</span>
    </span>
  )
}

export interface LocaleSwitcherProps {
  value: string
  options: readonly LocaleSwitcherOption[]
  onValueChange: (locale: string) => void
  pending?: boolean
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
}
export function LocaleSwitcher({
  value,
  options,
  onValueChange,
  pending,
  disabled,
  id,
  className,
  "aria-label": label,
}: LocaleSwitcherProps) {
  const labels = useUiLabels()
  const selected = options.find((option) => option.locale === value)
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || pending}
    >
      <SelectTrigger
        id={id}
        className={className}
        aria-label={label ?? labels.common.language}
        aria-busy={pending || undefined}
      >
        <SelectValue>
          {selected ? <OptionLabel option={selected} /> : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.locale}
            value={option.locale}
            textValue={option.label}
          >
            <OptionLabel option={option} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

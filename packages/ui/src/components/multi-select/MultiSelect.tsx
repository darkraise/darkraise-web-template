"use client"

import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@lib/utils"
import {
  Combobox,
  ComboboxClearTrigger,
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemText,
  ComboboxList,
  ComboboxTrigger,
  type ComboboxItemData,
  type ComboboxValueChangeDetails,
} from "@components/combobox"
import "./multi-select.css"

export type MultiSelectItem = ComboboxItemData

export interface MultiSelectProps {
  items: ComboboxItemData[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (details: ComboboxValueChangeDetails) => void
  placeholder?: string
  disabled?: boolean
  name?: string
  className?: string
  emptyMessage?: React.ReactNode
}

function MultiSelect({
  items,
  value,
  defaultValue,
  onValueChange,
  placeholder = "Select…",
  disabled,
  name,
  className,
  emptyMessage = "No matches.",
}: MultiSelectProps) {
  const [inputValue, setInputValue] = React.useState("")

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState<string[]>(
    defaultValue ?? [],
  )
  const selected = isControlled ? value : internalValue

  const itemByValue = React.useMemo(() => {
    const map = new Map<string, ComboboxItemData>()
    for (const it of items) map.set(it.value, it)
    return map
  }, [items])

  const filteredItems = React.useMemo(() => {
    if (!inputValue) return items
    const q = inputValue.toLowerCase()
    return items.filter((it) => it.label.toLowerCase().includes(q))
  }, [items, inputValue])

  const handleValueChange = (details: ComboboxValueChangeDetails) => {
    if (!isControlled) setInternalValue(details.value)
    onValueChange?.(details)
    // Clear the typeahead query after each toggle so the user can keep
    // selecting without manually clearing the filter.
    setInputValue("")
  }

  const removeChip = (chipValue: string) => {
    const next = selected.filter((v) => v !== chipValue)
    if (!isControlled) setInternalValue(next)
    const matchedItems = next
      .map((v) => itemByValue.get(v))
      .filter((it): it is ComboboxItemData => it !== undefined)
    onValueChange?.({ value: next, items: matchedItems })
  }

  const hasChips = selected.length > 0

  return (
    <Combobox
      items={filteredItems}
      multiple
      value={selected}
      inputValue={inputValue}
      onInputValueChange={(d) => setInputValue(d.value)}
      onValueChange={handleValueChange}
      disabled={disabled}
      name={name}
      placeholder={placeholder}
      className={cn("dr-multi-select", className)}
    >
      <ComboboxControl className="dr-multi-select-control">
        <div className="dr-multi-select-chips">
          {selected.map((v) => {
            const item = itemByValue.get(v)
            const label = item?.label ?? v
            return (
              <span key={v} className="dr-multi-select-chip">
                <span className="dr-multi-select-chip-label">{label}</span>
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  tabIndex={-1}
                  className="dr-multi-select-chip-remove"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (!disabled) removeChip(v)
                  }}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          <ComboboxInput
            placeholder={hasChips ? "" : placeholder}
            className="dr-multi-select-input"
          />
        </div>
        <div className="dr-multi-select-end">
          <ComboboxClearTrigger className="dr-multi-select-clear">
            <X className="h-4 w-4" />
          </ComboboxClearTrigger>
          <ComboboxTrigger className="dr-multi-select-toggle">
            <ChevronDown className="h-4 w-4" />
          </ComboboxTrigger>
        </div>
      </ComboboxControl>
      <ComboboxContent>
        <ComboboxList>
          {filteredItems.map((item) => (
            <ComboboxItem key={item.value} item={item}>
              <ComboboxItemText>{item.label}</ComboboxItemText>
              <ComboboxItemIndicator>
                <Check className="h-4 w-4" />
              </ComboboxItemIndicator>
            </ComboboxItem>
          ))}
        </ComboboxList>
        <ComboboxEmpty>
          <div className="dr-multi-select-empty">{emptyMessage}</div>
        </ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
  )
}

export { MultiSelect }

import * as React from "react"
import { useUiText } from "../../i18n/useUiText"
import { Search } from "lucide-react"

import { cn } from "@lib/utils"
import type { SurfaceFill } from "@lib/surface-fill"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@components/dialog"
import { useComposedRefs } from "@primitives/slot"
import { useId } from "@primitives/state"
import "./command.css"

type DialogProps = React.ComponentProps<typeof Dialog>

interface CommandItemRecord {
  id: string
  value: string
  textValue: string
  disabled: boolean
  group?: string
}

interface CommandContextValue {
  /** Current search input. */
  search: string
  setSearch: (next: string) => void
  /** Active selected item id. */
  activeId: string | null
  setActiveId: (id: string | null) => void
  /** Adds an item, or replaces the registered item with the same id in place. */
  registerItem: (item: CommandItemRecord) => void
  unregisterItem: (id: string) => void
  /** Registered items that match the search, in registration order. */
  visibleItems: CommandItemRecord[]
  /** Total registered items, used to gate first-render group hiding. */
  allItemsCount: number
  /** Filter predicate. Defaults to substring on textValue. */
  filter?: (value: string, search: string, keywords?: string[]) => number
  shouldFilter: boolean
  /** Whether the arrow keys wrap from the last enabled item to the first. */
  loop: boolean
  inputId: string
  listId: string
  labelId: string
  rootRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
}

const CommandContext = React.createContext<CommandContextValue | null>(null)

function useCommandContext(consumer: string): CommandContextValue {
  const ctx = React.useContext(CommandContext)
  if (!ctx) throw new Error(`${consumer} must be used within <Command>`)
  return ctx
}

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  filter?: (value: string, search: string, keywords?: string[]) => number
  shouldFilter?: boolean
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  loop?: boolean
  ref?: React.Ref<HTMLDivElement>
  /** Which plane the surface paints; nested non-portalled surfaces inherit it. */
  surface?: SurfaceFill
}

function Command({
  className,
  children,
  filter,
  shouldFilter = true,
  defaultValue,
  value,
  onValueChange,
  loop = true,
  surface,
  ref,
  ...rest
}: CommandProps) {
  const [search, setSearch] = React.useState(defaultValue ?? value ?? "")

  React.useEffect(() => {
    if (value !== undefined) setSearch(value)
  }, [value])

  const setSearchExternal = React.useCallback(
    (next: string) => {
      setSearch(next)
      onValueChange?.(next)
    },
    [onValueChange],
  )

  const inputId = useId()
  const listId = useId()
  const labelId = useId()
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const [items, setItems] = React.useState<CommandItemRecord[]>([])

  const registerItem = React.useCallback((item: CommandItemRecord) => {
    setItems((list) => {
      const at = list.findIndex((it) => it.id === item.id)
      if (at === -1) return [...list, item]
      const cur = list[at]
      if (
        cur &&
        cur.value === item.value &&
        cur.textValue === item.textValue &&
        cur.disabled === item.disabled &&
        cur.group === item.group
      ) {
        return list
      }
      return list.map((it, n) => (n === at ? item : it))
    })
  }, [])

  const unregisterItem = React.useCallback((id: string) => {
    setItems((list) => list.filter((it) => it.id !== id))
  }, [])

  const defaultFilter = React.useCallback((val: string, query: string) => {
    if (!query) return 1
    return val.toLowerCase().includes(query.toLowerCase()) ? 1 : 0
  }, [])

  const filterFn = filter ?? defaultFilter

  const visibleItems = React.useMemo((): CommandItemRecord[] => {
    if (!shouldFilter || !search) return items
    return items.filter((it) => {
      const score = filterFn(it.textValue, search)
      return score > 0
    })
  }, [items, shouldFilter, search, filterFn])

  const allItemsCount = items.length

  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Keep active item valid as visible set changes.
  React.useEffect(() => {
    const list = visibleItems
    if (list.length === 0) {
      if (activeId !== null) setActiveId(null)
      return
    }
    if (!activeId || !list.find((it) => it.id === activeId)) {
      const first = list.find((it) => !it.disabled)
      setActiveId(first?.id ?? null)
    }
  }, [activeId, visibleItems])

  const ctx = React.useMemo<CommandContextValue>(
    () => ({
      search,
      setSearch: setSearchExternal,
      activeId,
      setActiveId,
      registerItem,
      unregisterItem,
      visibleItems,
      allItemsCount,
      filter,
      shouldFilter,
      loop,
      inputId,
      listId,
      labelId,
      rootRef,
      inputRef,
    }),
    [
      search,
      setSearchExternal,
      activeId,
      registerItem,
      unregisterItem,
      visibleItems,
      allItemsCount,
      filter,
      shouldFilter,
      loop,
      inputId,
      listId,
      labelId,
    ],
  )

  return (
    <CommandContext.Provider value={ctx}>
      <div
        ref={(node) => {
          rootRef.current = node
          if (typeof ref === "function") ref(node)
          else if (ref)
            (ref as React.RefObject<HTMLDivElement | null>).current = node
        }}
        cmdk-root=""
        data-surface-fill={surface}
        className={cn("dr-command", className)}
        {...rest}
      >
        {children}
      </div>
    </CommandContext.Provider>
  )
}

interface CommandDialogProps extends DialogProps {
  title?: string
  description?: string
}

const CommandDialog = ({
  children,
  title,
  description,
  ...props
}: CommandDialogProps) => {
  const uiText = useUiText()
  return (
    <Dialog {...props}>
      <DialogContent className="dr-command-dialog-content overflow-hidden p-0">
        <DialogTitle className="sr-only">
          {title ?? uiText("Command Menu")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {description ?? uiText("Search for a command to run.")}
        </DialogDescription>
        <Command className="dr-command-dialog">{children}</Command>
      </DialogContent>
    </Dialog>
  )
}

interface CommandInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  ref?: React.Ref<HTMLInputElement>
  value?: string
  onValueChange?: (value: string) => void
}

function CommandInput({
  className,
  ref,
  value,
  onValueChange,
  onKeyDown,
  ...rest
}: CommandInputProps) {
  const ctx = useCommandContext("CommandInput")
  const composedRef = useComposedRefs(ctx.inputRef, ref)

  // Sync controlled prop.
  React.useEffect(() => {
    if (value !== undefined && value !== ctx.search) ctx.setSearch(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const moveActive = (delta: 1 | -1) => {
    const list = ctx.visibleItems
    const at = list.findIndex((it) => it.id === ctx.activeId)
    const start = at === -1 ? (delta === 1 ? -1 : list.length) : at
    for (let step = 1; step <= list.length; step++) {
      let next = start + delta * step
      if (next < 0 || next >= list.length) {
        if (!ctx.loop) return
        next = (next + list.length) % list.length
      }
      const item = list[next]
      if (item && !item.disabled) {
        ctx.setActiveId(item.id)
        return
      }
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      moveActive(1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      moveActive(-1)
    } else if (event.key === "Home") {
      event.preventDefault()
      const first = ctx.visibleItems.find((it) => !it.disabled)
      if (first) ctx.setActiveId(first.id)
    } else if (event.key === "End") {
      event.preventDefault()
      const last = [...ctx.visibleItems].reverse().find((it) => !it.disabled)
      if (last) ctx.setActiveId(last.id)
    } else if (event.key === "Enter") {
      event.preventDefault()
      const active = ctx.visibleItems.find((it) => it.id === ctx.activeId)
      if (active && !active.disabled) {
        document.getElementById(active.id)?.click()
      }
    }
  }

  return (
    <div className="dr-command-input-wrapper" cmdk-input-wrapper="">
      <Search
        className="me-2 size-[var(--icon-size)] shrink-0 opacity-50"
        aria-hidden="true"
      />
      <input
        ref={composedRef}
        cmdk-input=""
        type="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        role="combobox"
        aria-expanded
        aria-autocomplete="list"
        aria-controls={ctx.listId}
        aria-activedescendant={ctx.activeId ?? undefined}
        id={ctx.inputId}
        value={ctx.search}
        onChange={(event) => {
          const next = event.target.value
          ctx.setSearch(next)
          onValueChange?.(next)
        }}
        onKeyDown={handleKeyDown}
        className={cn("dr-command-input", className)}
        {...rest}
      />
    </div>
  )
}

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function CommandList({ className, ref, ...rest }: CommandListProps) {
  const ctx = useCommandContext("CommandList")
  return (
    <div
      ref={ref}
      role="listbox"
      id={ctx.listId}
      cmdk-list=""
      className={cn("dr-command-list", className)}
      {...rest}
    />
  )
}

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function CommandEmpty({ className, ref, ...rest }: CommandEmptyProps) {
  const ctx = useCommandContext("CommandEmpty")
  if (ctx.visibleItems.length > 0) return null
  return (
    <div
      ref={ref}
      role="presentation"
      cmdk-empty=""
      className={cn("dr-command-empty", className)}
      {...rest}
    />
  )
}

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: React.ReactNode
  /** Logical group key — usually equal to heading text. */
  value?: string
  ref?: React.Ref<HTMLDivElement>
}

const CommandGroupContext = React.createContext<string | undefined>(undefined)

function CommandGroup({
  className,
  heading,
  value,
  children,
  ref,
  ...rest
}: CommandGroupProps) {
  const ctx = useCommandContext("CommandGroup")
  const groupValue =
    value ?? (typeof heading === "string" ? heading : undefined)
  // Hide the group entirely once we know no descendant items are visible.
  // On the first render no item has registered yet, but children must mount
  // so they can register; we fall back to rendering when no items have
  // been registered yet so the first frame doesn't drop them.
  const list = ctx.visibleItems
  const someWithGroup = list.some((it) => it.group === groupValue)
  const itemsKnown = list.length > 0 || ctx.search === ""
  // Don't hide on the very first render (items not yet registered).
  const allRegistered = ctx.allItemsCount > 0
  const shouldHide =
    allRegistered && !someWithGroup && groupValue !== undefined && itemsKnown
  if (shouldHide) return null
  return (
    <div
      ref={ref}
      role="group"
      cmdk-group=""
      className={cn("dr-command-group", className)}
      {...rest}
    >
      {heading ? (
        <div cmdk-group-heading="" role="presentation">
          {heading}
        </div>
      ) : null}
      <CommandGroupContext.Provider value={groupValue}>
        {children}
      </CommandGroupContext.Provider>
    </div>
  )
}

interface CommandSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>
}

function CommandSeparator({ className, ref, ...rest }: CommandSeparatorProps) {
  return (
    <div
      ref={ref}
      role="separator"
      cmdk-separator=""
      className={cn("dr-command-separator", className)}
      {...rest}
    />
  )
}

interface CommandItemProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "onSelect"
> {
  value?: string
  disabled?: boolean
  onSelect?: (value: string) => void
  ref?: React.Ref<HTMLDivElement>
}

function CommandItem({
  className,
  children,
  value,
  disabled,
  onSelect,
  onClick,
  onPointerEnter,
  ref,
  ...rest
}: CommandItemProps) {
  const ctx = useCommandContext("CommandItem")
  const { registerItem, unregisterItem } = ctx
  const group = React.useContext(CommandGroupContext)
  const localRef = React.useRef<HTMLDivElement | null>(null)
  const textRef = React.useRef("")
  const id = useId()

  // Render until registration completes; afterwards, hide if filtered out.
  const visible =
    ctx.allItemsCount === 0 ||
    ctx.visibleItems.find((it) => it.id === id) !== undefined
  const selected = ctx.activeId === id

  // Unregistering is its own effect so a field change replaces the record in
  // place instead of removing it and appending it at the end of the order.
  React.useLayoutEffect(() => () => unregisterItem(id), [unregisterItem, id])

  // Without `value` the item is matched by its rendered text, so `children`
  // and `visible` are dependencies. While filtered out it renders nothing and
  // keeps the text it last rendered.
  React.useLayoutEffect(() => {
    if (localRef.current) textRef.current = localRef.current.textContent ?? ""
    const text = value ?? textRef.current
    registerItem({
      id,
      value: text,
      textValue: text,
      disabled: !!disabled,
      group,
    })
  }, [registerItem, id, value, disabled, group, children, visible])

  if (!visible) return null

  return (
    <div
      ref={(node) => {
        localRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref)
          (ref as React.RefObject<HTMLDivElement | null>).current = node
      }}
      id={id}
      role="option"
      aria-selected={selected}
      data-selected={selected ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      cmdk-item=""
      onPointerEnter={(event) => {
        onPointerEnter?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        ctx.setActiveId(id)
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (disabled) return
        onSelect?.(value ?? localRef.current?.textContent ?? "")
      }}
      className={cn("dr-command-item", className)}
      {...rest}
    >
      {children}
    </div>
  )
}

const CommandShortcut = ({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("dr-command-shortcut", className)} {...rest} />
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}

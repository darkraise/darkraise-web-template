"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import {
  type TreeNode,
  type TreeSelectionMode,
  type TreeViewExpandedChangeDetails,
  type TreeViewSelectionChangeDetails,
  type UseTreeViewOptions,
  type UseTreeViewReturn,
  useTreeView,
} from "./useTreeView"
import "./tree-view.css"

export type {
  TreeNode,
  TreeSelectionMode,
  TreeViewExpandedChangeDetails,
  TreeViewSelectionChangeDetails,
}

interface TreeViewContextValue extends UseTreeViewReturn {
  data?: TreeNode
  treeRef: React.RefObject<HTMLUListElement | null>
  rowRefs: React.RefObject<Map<string, HTMLElement>>
  registerRow: (id: string, el: HTMLElement | null) => void
  focusRow: (id: string) => void
}

const TreeViewContext = React.createContext<TreeViewContextValue | null>(null)

function useTreeViewContext(part: string): TreeViewContextValue {
  const ctx = React.useContext(TreeViewContext)
  if (!ctx) {
    throw new Error(`<${part}> must be used within a <TreeView> root component`)
  }
  return ctx
}

interface BranchContextValue {
  value: string
  depth: number
  parentId: string | null
  isOpen: boolean
}

const BranchContext = React.createContext<BranchContextValue | null>(null)

function useBranchContext(): BranchContextValue | null {
  return React.useContext(BranchContext)
}

export interface TreeViewProps
  extends
    Omit<UseTreeViewOptions, "data">,
    Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  data?: TreeNode
  children?: React.ReactNode
}

function TreeView({
  className,
  data,
  expanded,
  defaultExpanded,
  selected,
  defaultSelected,
  selectionMode = "single",
  disabled = false,
  onExpandedChange,
  onSelectedChange,
  children,
  ...rest
}: TreeViewProps) {
  const state = useTreeView({
    data,
    expanded,
    defaultExpanded,
    selected,
    defaultSelected,
    selectionMode,
    disabled,
    onExpandedChange,
    onSelectedChange,
  })

  const treeRef = React.useRef<HTMLUListElement | null>(null)
  const rowRefs = React.useRef<Map<string, HTMLElement>>(new Map())

  const registerRow = React.useCallback(
    (id: string, el: HTMLElement | null) => {
      if (el) rowRefs.current.set(id, el)
      else rowRefs.current.delete(id)
    },
    [],
  )

  const focusRow = React.useCallback(
    (id: string) => {
      state.setFocused(id)
      const el = rowRefs.current.get(id)
      el?.focus()
    },
    [state],
  )

  const ctx = React.useMemo<TreeViewContextValue>(
    () => ({
      ...state,
      data,
      treeRef,
      rowRefs,
      registerRow,
      focusRow,
    }),
    [state, data, registerRow, focusRow],
  )

  return (
    <div
      className={cn("dr-tree-view", className)}
      data-disabled={disabled ? "true" : undefined}
      {...rest}
    >
      <TreeViewContext.Provider value={ctx}>
        {children}
      </TreeViewContext.Provider>
    </div>
  )
}

export type TreeViewLabelProps = React.HTMLAttributes<HTMLDivElement>

function TreeViewLabel({ className, ...props }: TreeViewLabelProps) {
  const { baseId } = useTreeViewContext("TreeViewLabel")
  return (
    <div
      id={`${baseId}-label`}
      className={cn("dr-tree-view-label", className)}
      {...props}
    />
  )
}

export type TreeViewTreeProps = Omit<
  React.HTMLAttributes<HTMLUListElement>,
  "role"
>

function TreeViewTree({ className, onKeyDown, ...props }: TreeViewTreeProps) {
  const ctx = useTreeViewContext("TreeViewTree")
  const {
    treeRef,
    baseId,
    disabled,
    focused,
    setFocused,
    focusRow,
    toggleSelected,
    toggleExpanded,
    isExpanded,
    getNodeInfo,
    getVisibleNodes,
  } = ctx

  const handleKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (disabled) return

    const visible = getVisibleNodes()
    if (visible.length === 0) return

    const enabledVisible = visible.filter((n) => !n.disabled)
    if (enabledVisible.length === 0) return

    const currentId = focused ?? enabledVisible[0]?.id
    if (!currentId) return

    const focusedIndex = visible.findIndex((n) => n.id === currentId)

    const moveFocus = (direction: 1 | -1) => {
      if (focusedIndex < 0) {
        const target = enabledVisible[0]
        if (target) focusRow(target.id)
        return
      }
      let i = focusedIndex + direction
      while (i >= 0 && i < visible.length) {
        const node = visible[i]
        if (node && !node.disabled) {
          focusRow(node.id)
          return
        }
        i += direction
      }
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault()
        moveFocus(1)
        return
      }
      case "ArrowUp": {
        event.preventDefault()
        moveFocus(-1)
        return
      }
      case "ArrowRight": {
        event.preventDefault()
        if (focusedIndex < 0) return
        const node = visible[focusedIndex]
        if (!node) return
        if (node.hasChildren) {
          if (!isExpanded(node.id)) {
            toggleExpanded(node.id)
          } else {
            const next = visible[focusedIndex + 1]
            if (next && next.parentId === node.id && !next.disabled) {
              focusRow(next.id)
            }
          }
        }
        return
      }
      case "ArrowLeft": {
        event.preventDefault()
        if (focusedIndex < 0) return
        const node = visible[focusedIndex]
        if (!node) return
        if (node.hasChildren && isExpanded(node.id)) {
          toggleExpanded(node.id)
          return
        }
        if (node.parentId) {
          const parentInfo = getNodeInfo(node.parentId)
          if (parentInfo && !parentInfo.disabled) {
            focusRow(node.parentId)
          }
        }
        return
      }
      case "Home": {
        event.preventDefault()
        const first = enabledVisible[0]
        if (first) focusRow(first.id)
        return
      }
      case "End": {
        event.preventDefault()
        const last = enabledVisible[enabledVisible.length - 1]
        if (last) focusRow(last.id)
        return
      }
      case "Enter":
      case " ": {
        event.preventDefault()
        if (focusedIndex < 0) return
        const node = visible[focusedIndex]
        if (!node || node.disabled) return
        toggleSelected(node.id)
        return
      }
      default:
        return
    }
  }

  const handleFocus = (event: React.FocusEvent<HTMLUListElement>) => {
    if (event.target === event.currentTarget && focused === null) {
      const visible = getVisibleNodes().filter((n) => !n.disabled)
      const first = visible[0]
      if (first) {
        setFocused(first.id)
      }
    }
  }

  return (
    <ul
      ref={treeRef}
      role="tree"
      aria-labelledby={`${baseId}-label`}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "true" : undefined}
      className={cn("dr-tree-view-tree", className)}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      {...props}
    />
  )
}

export interface TreeViewBranchProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  "value"
> {
  value: string
  nodeDisabled?: boolean
}

function TreeViewBranch({
  className,
  value,
  nodeDisabled = false,
  children,
  ...props
}: TreeViewBranchProps) {
  const ctx = useTreeViewContext("TreeViewBranch")
  const parent = useBranchContext()
  const depth = parent ? parent.depth + 1 : 0
  const parentId = parent ? parent.value : null

  const { registerNode, isExpanded, isSelected, isFocused } = ctx

  React.useEffect(() => {
    return registerNode(value, {
      depth,
      hasChildren: true,
      disabled: nodeDisabled,
      parentId,
    })
  }, [registerNode, value, depth, nodeDisabled, parentId])

  const isOpen = isExpanded(value)
  const selected = isSelected(value)
  const focused = isFocused(value)

  const branchCtx = React.useMemo<BranchContextValue>(
    () => ({ value, depth, parentId, isOpen }),
    [value, depth, parentId, isOpen],
  )

  return (
    <li
      role="treeitem"
      aria-expanded={isOpen}
      aria-selected={ctx.selectionMode !== "none" ? selected : undefined}
      aria-disabled={nodeDisabled || undefined}
      aria-level={depth + 1}
      data-state={isOpen ? "open" : "closed"}
      data-selected={selected ? "true" : undefined}
      data-focused={focused ? "true" : undefined}
      data-disabled={nodeDisabled ? "true" : undefined}
      data-depth={depth}
      className={cn("dr-tree-view-branch", className)}
      {...props}
    >
      <BranchContext.Provider value={branchCtx}>
        {children}
      </BranchContext.Provider>
    </li>
  )
}

export type TreeViewBranchControlProps = React.HTMLAttributes<HTMLDivElement>

function TreeViewBranchControl({
  className,
  onClick,
  onFocus,
  style,
  ...props
}: TreeViewBranchControlProps) {
  const ctx = useTreeViewContext("TreeViewBranchControl")
  const branch = useBranchContext()
  if (!branch) {
    throw new Error(
      "<TreeViewBranchControl> must be used within a <TreeViewBranch>",
    )
  }
  const { disabled: treeDisabled, isFocused, isSelected } = ctx

  const nodeInfo = ctx.getNodeInfo(branch.value)
  const nodeDisabled = nodeInfo?.disabled ?? false
  const isDisabled = treeDisabled || nodeDisabled

  const rowRef = React.useRef<HTMLDivElement | null>(null)

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rowRef.current = node
      ctx.registerRow(branch.value, node)
    },
    [ctx, branch.value],
  )

  const isCurrentlyFocused = isFocused(branch.value)
  const selected = isSelected(branch.value)
  // Only one row should have tabIndex=0; default to currently focused row,
  // otherwise the tree itself takes the tabstop via the first visible node.
  const finalTabIndex = isCurrentlyFocused ? 0 : -1

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (isDisabled) return
    ctx.focusRow(branch.value)
    ctx.toggleExpanded(branch.value)
    ctx.toggleSelected(branch.value)
  }

  const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    onFocus?.(event)
    if (event.defaultPrevented) return
    ctx.setFocused(branch.value)
  }

  return (
    <div
      ref={setRef}
      role="presentation"
      tabIndex={isDisabled ? -1 : finalTabIndex}
      data-state={branch.isOpen ? "open" : "closed"}
      data-selected={selected ? "true" : undefined}
      data-focused={isCurrentlyFocused ? "true" : undefined}
      data-disabled={isDisabled ? "true" : undefined}
      data-depth={branch.depth}
      className={cn("dr-tree-view-branch-control", className)}
      style={{
        paddingInlineStart: `calc(${branch.depth} * var(--tree-view-indent, 1rem))`,
        ...style,
      }}
      onClick={handleClick}
      onFocus={handleFocus}
      {...props}
    />
  )
}

export type TreeViewBranchIndicatorProps = React.HTMLAttributes<HTMLSpanElement>

function TreeViewBranchIndicator({
  className,
  children,
  ...props
}: TreeViewBranchIndicatorProps) {
  const branch = useBranchContext()
  return (
    <span
      aria-hidden="true"
      data-state={branch?.isOpen ? "open" : "closed"}
      className={cn("dr-tree-view-branch-indicator", className)}
      {...props}
    >
      {children}
    </span>
  )
}

export type TreeViewBranchTextProps = React.HTMLAttributes<HTMLSpanElement>

function TreeViewBranchText({ className, ...props }: TreeViewBranchTextProps) {
  return (
    <span className={cn("dr-tree-view-branch-text", className)} {...props} />
  )
}

export type TreeViewBranchContentProps = React.HTMLAttributes<HTMLUListElement>

function TreeViewBranchContent({
  className,
  ...props
}: TreeViewBranchContentProps) {
  const branch = useBranchContext()
  if (!branch) {
    throw new Error(
      "<TreeViewBranchContent> must be used within a <TreeViewBranch>",
    )
  }
  if (!branch.isOpen) return null
  return (
    <ul
      role="group"
      data-state="open"
      className={cn("dr-tree-view-branch-content", className)}
      {...props}
    />
  )
}

export interface TreeViewItemProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  "value" | "onSelect"
> {
  value: string
  nodeDisabled?: boolean
}

function TreeViewItem({
  className,
  value,
  nodeDisabled = false,
  onClick,
  onFocus,
  style,
  children,
  ...props
}: TreeViewItemProps) {
  const ctx = useTreeViewContext("TreeViewItem")
  const parent = useBranchContext()
  const depth = parent ? parent.depth + 1 : 0
  const parentId = parent ? parent.value : null

  const {
    registerNode,
    isSelected,
    isFocused,
    focused,
    disabled: treeDisabled,
  } = ctx

  React.useEffect(() => {
    return registerNode(value, {
      depth,
      hasChildren: false,
      disabled: nodeDisabled,
      parentId,
    })
  }, [registerNode, value, depth, nodeDisabled, parentId])

  const selected = isSelected(value)
  const isCurrentlyFocused = isFocused(value)
  const isDisabled = treeDisabled || nodeDisabled

  const itemRef = React.useRef<HTMLLIElement | null>(null)
  const setRef = React.useCallback(
    (node: HTMLLIElement | null) => {
      itemRef.current = node
      ctx.registerRow(value, node)
    },
    [ctx, value],
  )

  // Mark variable as used while keeping intent visible.
  void focused

  const finalTabIndex = isCurrentlyFocused ? 0 : -1

  const handleClick = (event: React.MouseEvent<HTMLLIElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (isDisabled) return
    ctx.focusRow(value)
    ctx.toggleSelected(value)
  }

  const handleFocus = (event: React.FocusEvent<HTMLLIElement>) => {
    onFocus?.(event)
    if (event.defaultPrevented) return
    ctx.setFocused(value)
  }

  return (
    <li
      ref={setRef}
      role="treeitem"
      tabIndex={isDisabled ? -1 : finalTabIndex}
      aria-selected={ctx.selectionMode !== "none" ? selected : undefined}
      aria-disabled={isDisabled || undefined}
      aria-level={depth + 1}
      data-selected={selected ? "true" : undefined}
      data-focused={isCurrentlyFocused ? "true" : undefined}
      data-disabled={isDisabled ? "true" : undefined}
      data-depth={depth}
      className={cn("dr-tree-view-item", className)}
      style={{
        paddingInlineStart: `calc(${depth} * var(--tree-view-indent, 1rem))`,
        ...style,
      }}
      onClick={handleClick}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </li>
  )
}

export interface TreeViewNodeProps {
  node: TreeNode
}

function TreeViewNode({ node }: TreeViewNodeProps) {
  if (node.children && node.children.length > 0) {
    return (
      <TreeViewBranch value={node.id} nodeDisabled={node.disabled}>
        <TreeViewBranchControl>
          <TreeViewBranchIndicator>
            <DefaultChevron />
          </TreeViewBranchIndicator>
          <TreeViewBranchText>{node.name}</TreeViewBranchText>
        </TreeViewBranchControl>
        <TreeViewBranchContent>
          {node.children.map((child) => (
            <TreeViewNode key={child.id} node={child} />
          ))}
        </TreeViewBranchContent>
      </TreeViewBranch>
    )
  }
  return (
    <TreeViewItem value={node.id} nodeDisabled={node.disabled}>
      {node.name}
    </TreeViewItem>
  )
}

function DefaultChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export {
  TreeView,
  TreeViewLabel,
  TreeViewTree,
  TreeViewBranch,
  TreeViewBranchControl,
  TreeViewBranchIndicator,
  TreeViewBranchText,
  TreeViewBranchContent,
  TreeViewItem,
  TreeViewNode,
}

"use client"

import * as React from "react"

export interface TreeNode {
  id: string
  name: string
  children?: TreeNode[]
  disabled?: boolean
}

export type TreeSelectionMode = "single" | "multiple" | "none"

export interface TreeViewExpandedChangeDetails {
  value: string[]
}

export interface TreeViewSelectionChangeDetails {
  value: string[]
}

export interface VisibleNode {
  id: string
  depth: number
  hasChildren: boolean
  disabled: boolean
  parentId: string | null
}

export interface UseTreeViewOptions {
  data?: TreeNode
  expanded?: string[]
  defaultExpanded?: string[]
  selected?: string[]
  defaultSelected?: string[]
  selectionMode?: TreeSelectionMode
  disabled?: boolean
  onExpandedChange?: (details: TreeViewExpandedChangeDetails) => void
  onSelectedChange?: (details: TreeViewSelectionChangeDetails) => void
}

export interface UseTreeViewReturn {
  baseId: string
  expanded: string[]
  selected: string[]
  focused: string | null
  selectionMode: TreeSelectionMode
  disabled: boolean
  isExpanded: (id: string) => boolean
  isSelected: (id: string) => boolean
  isFocused: (id: string) => boolean
  setExpanded: (next: string[]) => void
  toggleExpanded: (id: string) => void
  setSelected: (next: string[]) => void
  toggleSelected: (id: string) => void
  setFocused: (id: string | null) => void
  registerNode: (id: string, info: NodeRegistration) => () => void
  getNodeInfo: (id: string) => NodeRegistration | undefined
  getVisibleNodes: () => VisibleNode[]
  getNodeId: (id: string) => string
}

export interface NodeRegistration {
  depth: number
  hasChildren: boolean
  disabled: boolean
  parentId: string | null
}

export function useTreeView(options: UseTreeViewOptions): UseTreeViewReturn {
  const {
    expanded: expandedProp,
    defaultExpanded = [],
    selected: selectedProp,
    defaultSelected = [],
    selectionMode = "single",
    disabled = false,
    onExpandedChange,
    onSelectedChange,
  } = options

  const baseId = React.useId()

  const expandedControlled = expandedProp !== undefined
  const selectedControlled = selectedProp !== undefined

  const [internalExpanded, setInternalExpanded] =
    React.useState<string[]>(defaultExpanded)
  const [internalSelected, setInternalSelected] =
    React.useState<string[]>(defaultSelected)
  const [focused, setFocusedState] = React.useState<string | null>(null)

  const expanded = expandedControlled
    ? (expandedProp as string[])
    : internalExpanded
  const selected = selectedControlled
    ? (selectedProp as string[])
    : internalSelected

  const onExpandedChangeRef = React.useRef(onExpandedChange)
  const onSelectedChangeRef = React.useRef(onSelectedChange)
  React.useEffect(() => {
    onExpandedChangeRef.current = onExpandedChange
    onSelectedChangeRef.current = onSelectedChange
  })

  const setExpanded = React.useCallback(
    (next: string[]) => {
      if (!expandedControlled) setInternalExpanded(next)
      onExpandedChangeRef.current?.({ value: next })
    },
    [expandedControlled],
  )

  const toggleExpanded = React.useCallback(
    (id: string) => {
      const isOpen = expanded.includes(id)
      const next = isOpen ? expanded.filter((v) => v !== id) : [...expanded, id]
      setExpanded(next)
    },
    [expanded, setExpanded],
  )

  const setSelected = React.useCallback(
    (next: string[]) => {
      if (!selectedControlled) setInternalSelected(next)
      onSelectedChangeRef.current?.({ value: next })
    },
    [selectedControlled],
  )

  const toggleSelected = React.useCallback(
    (id: string) => {
      if (selectionMode === "none") return
      if (selectionMode === "single") {
        if (selected[0] === id) return
        setSelected([id])
        return
      }
      const exists = selected.includes(id)
      const next = exists ? selected.filter((v) => v !== id) : [...selected, id]
      setSelected(next)
    },
    [selected, selectionMode, setSelected],
  )

  const setFocused = React.useCallback((id: string | null) => {
    setFocusedState(id)
  }, [])

  const isExpanded = React.useCallback(
    (id: string) => expanded.includes(id),
    [expanded],
  )
  const isSelected = React.useCallback(
    (id: string) => selected.includes(id),
    [selected],
  )
  const isFocused = React.useCallback((id: string) => focused === id, [focused])

  const nodeRegistryRef = React.useRef<Map<string, NodeRegistration>>(new Map())
  const orderedIdsRef = React.useRef<string[]>([])
  const [, forceRender] = React.useReducer((c: number) => c + 1, 0)

  const registerNode = React.useCallback(
    (id: string, info: NodeRegistration) => {
      nodeRegistryRef.current.set(id, info)
      if (!orderedIdsRef.current.includes(id)) {
        orderedIdsRef.current.push(id)
      }
      forceRender()
      return () => {
        nodeRegistryRef.current.delete(id)
        orderedIdsRef.current = orderedIdsRef.current.filter((v) => v !== id)
        forceRender()
      }
    },
    [],
  )

  const getNodeInfo = React.useCallback(
    (id: string) => nodeRegistryRef.current.get(id),
    [],
  )

  const getVisibleNodes = React.useCallback((): VisibleNode[] => {
    // Build a hidden set: any descendant of a collapsed branch is hidden.
    const registry = nodeRegistryRef.current
    const ordered = orderedIdsRef.current
    // Map parent -> children (in registration order, which mirrors render order).
    const childrenByParent = new Map<string | null, string[]>()
    for (const id of ordered) {
      const info = registry.get(id)
      if (!info) continue
      const list = childrenByParent.get(info.parentId) ?? []
      list.push(id)
      childrenByParent.set(info.parentId, list)
    }

    const result: VisibleNode[] = []
    const walk = (parentId: string | null) => {
      const ids = childrenByParent.get(parentId) ?? []
      for (const id of ids) {
        const info = registry.get(id)
        if (!info) continue
        result.push({
          id,
          depth: info.depth,
          hasChildren: info.hasChildren,
          disabled: info.disabled,
          parentId: info.parentId,
        })
        if (info.hasChildren && expanded.includes(id)) {
          walk(id)
        }
      }
    }
    walk(null)
    return result
  }, [expanded])

  const getNodeId = React.useCallback(
    (id: string) => `${baseId}-node-${id}`,
    [baseId],
  )

  return {
    baseId,
    expanded,
    selected,
    focused,
    selectionMode,
    disabled,
    isExpanded,
    isSelected,
    isFocused,
    setExpanded,
    toggleExpanded,
    setSelected,
    toggleSelected,
    setFocused,
    registerNode,
    getNodeInfo,
    getVisibleNodes,
    getNodeId,
  }
}

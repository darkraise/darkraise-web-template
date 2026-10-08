import * as React from "react"
import { useComposedRefs } from "../slot/composeRefs"
import { usePresence } from "./usePresence"

export interface PresenceProps {
  present: boolean
  forceMount?: boolean
  children: React.ReactElement<{
    ref?: React.Ref<HTMLElement>
    "data-state"?: string
  }>
}

export function Presence({
  present,
  forceMount,
  children,
}: PresenceProps): React.ReactElement | null {
  const [node, setNode] = React.useState<HTMLElement | null>(null)
  const nodeRef = React.useRef<HTMLElement | null>(null)
  React.useEffect(() => {
    nodeRef.current = node
  }, [node])
  const { isPresent, state } = usePresence(present, nodeRef)
  // In React 19 the ref of a child is a regular prop (`children.props.ref`).
  // Reading the legacy `children.ref` accessor logs a removal warning.
  const composedRef = useComposedRefs<HTMLElement>(setNode, children.props.ref)
  if (!isPresent && !forceMount) return null
  return React.cloneElement(children, {
    ref: composedRef,
    "data-state": state,
  })
}

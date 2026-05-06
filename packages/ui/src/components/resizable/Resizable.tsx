import { GripVertical } from "lucide-react"
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type SeparatorProps,
} from "react-resizable-panels"

import { cn } from "@lib/utils"
import "./resizable.css"

function ResizablePanelGroup({ className, ...props }: GroupProps) {
  return (
    <Group className={cn("dr-resizable-panel-group", className)} {...props} />
  )
}

const ResizablePanel = Panel

function ResizableHandle({
  withHandle,
  className,
  ...props
}: SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <Separator className={cn("dr-resizable-handle", className)} {...props}>
      {withHandle && (
        <div className="dr-resizable-handle-grip">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }

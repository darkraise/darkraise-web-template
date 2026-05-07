type Priority = "polite" | "assertive"

const regions: Partial<Record<Priority, HTMLElement>> = {}

function getOrCreateRegion(priority: Priority): HTMLElement {
  let node = regions[priority]
  if (node && document.body.contains(node)) return node
  node = document.createElement("div")
  node.setAttribute("aria-live", priority)
  node.setAttribute("aria-atomic", "true")
  node.style.position = "absolute"
  node.style.width = "1px"
  node.style.height = "1px"
  node.style.margin = "-1px"
  node.style.padding = "0"
  node.style.overflow = "hidden"
  node.style.clip = "rect(0,0,0,0)"
  node.style.whiteSpace = "nowrap"
  node.style.border = "0"
  document.body.append(node)
  regions[priority] = node
  return node
}

export function announce(message: string, priority: Priority = "polite"): void {
  const region = getOrCreateRegion(priority)
  region.textContent = message
}

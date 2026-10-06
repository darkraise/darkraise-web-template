import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@lib/utils"

export interface FrameProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  /** Optional content rendered inside the iframe <head>. Useful for stylesheets. */
  head?: React.ReactNode
}

/**
 * Renders children into an isolated iframe document. Only the host's colour
 * scheme crosses in; style the content through `head`.
 */
function Frame({ className, head, children, ...rest }: FrameProps) {
  const ref = React.useRef<HTMLIFrameElement | null>(null)
  const [doc, setDoc] = React.useState<Document | null>(null)

  React.useEffect(() => {
    const node = ref.current
    if (!node) return
    // jsdom and modern browsers expose contentDocument synchronously for
    // same-origin iframes, but the document may need a load event in a real
    // browser. Listen and update.
    const update = () => setDoc(node.contentDocument)
    update()
    node.addEventListener("load", update)
    return () => node.removeEventListener("load", update)
  }, [])

  React.useEffect(() => {
    if (!doc) return
    const host = document.documentElement
    const sync = () => {
      const mode = host.getAttribute("data-mode")
      doc.documentElement.style.colorScheme =
        mode === "light" || mode === "dark" ? mode : ""
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(host, { attributes: true, attributeFilter: ["data-mode"] })
    return () => observer.disconnect()
  }, [doc])

  return (
    <iframe ref={ref} className={cn("dr-frame", className)} {...rest}>
      {doc
        ? createPortal(
            <>
              {head ? createPortal(head, doc.head) : null}
              {children}
            </>,
            doc.body,
          )
        : null}
    </iframe>
  )
}

export { Frame }

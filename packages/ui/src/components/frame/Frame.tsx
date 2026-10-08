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

  const [mode, setMode] = React.useState<"light" | "dark" | null>(null)

  React.useEffect(() => {
    const host = document.documentElement
    const sync = () => {
      const value = host.getAttribute("data-mode")
      setMode(value === "light" || value === "dark" ? value : null)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(host, { attributes: true, attributeFilter: ["data-mode"] })
    return () => observer.disconnect()
  }, [])

  return (
    <iframe ref={ref} className={cn("dr-frame", className)} {...rest}>
      {doc
        ? createPortal(
            <>
              {createPortal(
                <>
                  {/* :where keeps the rule at zero specificity, so any frame
                      stylesheet can set its own scheme. */}
                  {mode ? (
                    <style>{":where(:root){color-scheme:" + mode + "}"}</style>
                  ) : null}
                  {head}
                </>,
                doc.head,
              )}
              {children}
            </>,
            doc.body,
          )
        : null}
    </iframe>
  )
}

export { Frame }

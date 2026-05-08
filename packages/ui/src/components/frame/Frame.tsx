import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@lib/utils"

export interface FrameProps extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  /** Optional content rendered inside the iframe <head>. Useful for stylesheets. */
  head?: React.ReactNode
}

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

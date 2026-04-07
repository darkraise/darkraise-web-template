import { useState, useCallback } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "darkraise-ui/components/accordion"

export function ShowcaseExample({
  title,
  code,
  children,
}: {
  title: string
  code: string
  children: React.ReactNode
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </p>
      <div className="border-border rounded-md border p-4">{children}</div>
      <Accordion type="single" collapsible>
        <AccordionItem value="code" className="border-none">
          <div className="flex items-center justify-between">
            <AccordionTrigger className="text-muted-foreground py-1 text-xs hover:no-underline">
              View code
            </AccordionTrigger>
            <button
              type="button"
              onClick={handleCopy}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded px-2 py-1 text-xs transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <AccordionContent className="pt-1">
            <pre className="bg-muted overflow-x-auto rounded-md p-4">
              <code className="font-mono text-xs">{code}</code>
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

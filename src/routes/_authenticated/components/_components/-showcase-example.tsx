import { useState, useCallback } from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/components/ui/accordion"

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
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="rounded-md border border-border p-4">{children}</div>
      <Accordion type="single" collapsible>
        <AccordionItem value="code" className="border-none">
          <div className="flex items-center justify-between">
            <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
              View code
            </AccordionTrigger>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <AccordionContent className="pt-1">
            <pre className="overflow-x-auto rounded-md bg-muted p-4">
              <code className="font-mono text-xs">{code}</code>
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

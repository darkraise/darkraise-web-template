import { createFileRoute } from "@tanstack/react-router"
import { Check, Copy } from "lucide-react"
import {
  Clipboard,
  ClipboardControl,
  ClipboardIndicator,
  ClipboardInput,
  ClipboardLabel,
  ClipboardTrigger,
} from "darkraise-ui/components/clipboard"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/clipboard")({
  component: ClipboardPage,
})

function ClipboardPage() {
  return (
    <ShowcasePage
      title="Clipboard"
      description="Copy text to the clipboard with built-in success feedback and an auto-revert timeout."
    >
      <ShowcaseExample
        title="Copy a code snippet"
        code={`<Clipboard value="pnpm add darkraise-ui">
  <ClipboardLabel>Install command</ClipboardLabel>
  <ClipboardControl>
    <ClipboardInput />
    <ClipboardTrigger>
      <ClipboardIndicator
        copied={<Check className="h-4 w-4" />}
        fallback={<Copy className="h-4 w-4" />}
      />
    </ClipboardTrigger>
  </ClipboardControl>
</Clipboard>`}
      >
        <Clipboard value="pnpm add darkraise-ui">
          <ClipboardLabel>Install command</ClipboardLabel>
          <ClipboardControl>
            <ClipboardInput />
            <ClipboardTrigger>
              <ClipboardIndicator
                copied={<Check className="h-4 w-4" />}
                fallback={<Copy className="h-4 w-4" />}
              />
            </ClipboardTrigger>
          </ClipboardControl>
        </Clipboard>
      </ShowcaseExample>

      <ShowcaseExample
        title="Copy a long URL"
        code={`<Clipboard value="https://example.com/very/long/path/to/some/resource?with=query&and=more-params">
  <ClipboardLabel>Share link</ClipboardLabel>
  <ClipboardControl>
    <ClipboardInput />
    <ClipboardTrigger>
      <ClipboardIndicator
        copied={<Check className="h-4 w-4" />}
        fallback={<Copy className="h-4 w-4" />}
      />
    </ClipboardTrigger>
  </ClipboardControl>
</Clipboard>`}
      >
        <Clipboard value="https://example.com/very/long/path/to/some/resource?with=query&and=more-params">
          <ClipboardLabel>Share link</ClipboardLabel>
          <ClipboardControl>
            <ClipboardInput />
            <ClipboardTrigger>
              <ClipboardIndicator
                copied={<Check className="h-4 w-4" />}
                fallback={<Copy className="h-4 w-4" />}
              />
            </ClipboardTrigger>
          </ClipboardControl>
        </Clipboard>
      </ShowcaseExample>

      <ShowcaseExample
        title="Custom timeout with success-state pulse"
        code={`<Clipboard value="darkraise-token-abc123" timeout={4000}>
  <ClipboardLabel>API token (4 second feedback)</ClipboardLabel>
  <ClipboardControl>
    <ClipboardInput />
    <ClipboardTrigger>
      <ClipboardIndicator
        copied={<Check className="h-4 w-4" />}
        fallback={<Copy className="h-4 w-4" />}
      />
    </ClipboardTrigger>
  </ClipboardControl>
</Clipboard>`}
      >
        <Clipboard value="darkraise-token-abc123" timeout={4000}>
          <ClipboardLabel>API token (4 second feedback)</ClipboardLabel>
          <ClipboardControl>
            <ClipboardInput />
            <ClipboardTrigger>
              <ClipboardIndicator
                copied={<Check className="h-4 w-4" />}
                fallback={<Copy className="h-4 w-4" />}
              />
            </ClipboardTrigger>
          </ClipboardControl>
        </Clipboard>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

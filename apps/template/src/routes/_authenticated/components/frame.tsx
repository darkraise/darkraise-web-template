import { createFileRoute } from "@tanstack/react-router"
import { Frame } from "darkraise-ui/components/frame"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/frame")({
  component: FramePage,
})

function FramePage() {
  return (
    <ShowcasePage
      title="Frame"
      description="An iframe wrapper that lets you render React children inside a fully isolated document. Useful for sandboxing styles, previewing email templates, or embedding untrusted markup."
    >
      <ShowcaseExample
        title="Basic"
        code={`<Frame style={{ width: 300, height: 200 }}>
  <div>Hello inside iframe</div>
</Frame>`}
      >
        <Frame
          style={{ width: 300, height: 200 }}
          className="border-border rounded-md border"
        >
          <div
            style={{
              padding: "1rem",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <p>Hello inside iframe</p>
            <p style={{ color: "#666", fontSize: "0.85rem" }}>
              Nothing from the parent document leaks in here.
            </p>
          </div>
        </Frame>
      </ShowcaseExample>

      <ShowcaseExample
        title="With head"
        code={`<Frame
  style={{ width: 300, height: 200 }}
  head={
    <style>{\`body { background: lavender; font-family: sans-serif; }\`}</style>
  }
>
  <h2>Styled inside</h2>
  <p>The body background and font come from the iframe head.</p>
</Frame>`}
      >
        <Frame
          style={{ width: 300, height: 200 }}
          className="border-border rounded-md border"
          head={
            <style>{`body { background: lavender; font-family: sans-serif; margin: 0; padding: 1rem; }`}</style>
          }
        >
          <h2 style={{ marginTop: 0 }}>Styled inside</h2>
          <p>The body background and font come from the iframe head.</p>
        </Frame>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

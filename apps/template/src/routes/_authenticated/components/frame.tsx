import { useEffect, useState, type ReactNode } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Frame } from "darkraise-ui/components/frame"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "darkraise-ui/components/toggle-group"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/frame")({
  component: FramePage,
})

type Viewport = "375" | "768" | "1280"

const responsivePageCss = `
  body { margin: 0; padding: 1rem; font-family: system-ui, sans-serif; color: #1f2937; }
  header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; }
  header h1 { font-size: 1rem; margin: 0; }
  header nav { font-size: 0.85rem; color: #6b7280; }
  .layout { display: grid; gap: 1rem; padding-top: 1rem; }
  .card { background: #f3f4f6; padding: 1rem; border-radius: 8px; }
  .card h2 { margin: 0 0 0.5rem; font-size: 0.95rem; }
  .card p { margin: 0; font-size: 0.85rem; color: #4b5563; }
  @media (min-width: 700px) {
    .layout { grid-template-columns: 200px 1fr; }
  }
  @media (min-width: 1100px) {
    .layout { grid-template-columns: 220px 1fr 220px; }
  }
`

function ResponsiveViewportExample() {
  const [width, setWidth] = useState<Viewport>("375")

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        value={width}
        onValueChange={(v) => {
          if (v) setWidth(v as Viewport)
        }}
      >
        <ToggleGroupItem value="375">Mobile · 375</ToggleGroupItem>
        <ToggleGroupItem value="768">Tablet · 768</ToggleGroupItem>
        <ToggleGroupItem value="1280">Desktop · 1280</ToggleGroupItem>
      </ToggleGroup>
      <Frame
        style={{ width: Number(width), maxWidth: "100%", height: 320 }}
        className="border-border rounded-md border"
        head={<style>{responsivePageCss}</style>}
      >
        <header>
          <h1>Acme Reports</h1>
          <nav>Home · Reports · Settings</nav>
        </header>
        <div className="layout">
          <aside className="card">
            <h2>Filters</h2>
            <p>Date range, region, segment.</p>
          </aside>
          <section className="card">
            <h2>Revenue</h2>
            <p>
              The middle column flexes; sidebars only appear at wider widths.
            </p>
          </section>
          <aside className="card">
            <h2>Activity</h2>
            <p>Right rail shows on desktop only.</p>
          </aside>
        </div>
      </Frame>
    </div>
  )
}

function EmailTemplatePreviewExample() {
  return (
    <Frame
      style={{ width: "100%", height: 520 }}
      className="border-border rounded-md border"
      head={
        <style>{`body { margin: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }`}</style>
      }
    >
      <table
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ padding: "24px 0" }}
      >
        <tbody>
          <tr>
            <td align="center">
              <table
                width={560}
                cellPadding={0}
                cellSpacing={0}
                style={{
                  background: "#ffffff",
                  borderRadius: 8,
                  overflow: "hidden",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        background: "#4f46e5",
                        padding: "20px 24px",
                        color: "#ffffff",
                      }}
                    >
                      <strong style={{ fontSize: 16 }}>Acme</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "32px 24px" }}>
                      <h1 style={{ margin: "0 0 12px", fontSize: 22 }}>
                        Welcome aboard, Jane
                      </h1>
                      <p
                        style={{
                          margin: "0 0 16px",
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: "#374151",
                        }}
                      >
                        Thanks for signing up. Tap the button below to verify
                        your email and finish setting up your account.
                      </p>
                      <table cellPadding={0} cellSpacing={0}>
                        <tbody>
                          <tr>
                            <td
                              style={{
                                background: "#4f46e5",
                                borderRadius: 6,
                              }}
                            >
                              <a
                                href="#"
                                style={{
                                  display: "inline-block",
                                  padding: "10px 18px",
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#ffffff",
                                  textDecoration: "none",
                                }}
                              >
                                Verify email
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p
                        style={{
                          margin: "20px 0 0",
                          fontSize: 12,
                          color: "#6b7280",
                        }}
                      >
                        If you didn't create this account you can safely ignore
                        this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: "16px 24px",
                        background: "#f9fafb",
                        fontSize: 12,
                        color: "#6b7280",
                      }}
                    >
                      Acme Inc · 1 Infinite Loop · Cupertino, CA
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </Frame>
  )
}

const aggressiveOverrideCss = `
  .frame-aggressive-overrides * {
    color: #dc2626 !important;
    font-family: "Comic Sans MS", cursive !important;
    text-transform: uppercase;
  }
`

function StyleIsolationContrastExample() {
  return (
    <div className="frame-aggressive-overrides space-y-4">
      <style>{aggressiveOverrideCss}</style>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border-border rounded-md border p-4">
          <p className="text-muted-foreground mb-2 text-xs">
            Plain div (clobbered by parent rule)
          </p>
          <h3 className="text-base font-semibold">Welcome back</h3>
          <p className="text-sm">
            This content inherits the aggressive parent override.
          </p>
        </div>
        <Frame
          style={{ width: "100%", height: 160 }}
          className="border-border rounded-md border"
          head={
            <style>{`body { margin: 0; padding: 1rem; font-family: system-ui, sans-serif; color: #1f2937; }`}</style>
          }
        >
          <p
            style={{
              margin: "0 0 0.5rem",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            Inside Frame (isolated)
          </p>
          <h3 style={{ margin: "0 0 0.25rem", fontSize: 16, fontWeight: 600 }}>
            Welcome back
          </h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            The same content rendered inside the iframe is unaffected.
          </p>
        </Frame>
      </div>
    </div>
  )
}

function useDocumentStyles(): ReactNode {
  const [nodes, setNodes] = useState<ReactNode[]>([])

  useEffect(() => {
    const out: ReactNode[] = []
    document.head
      .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
      .forEach((el, i) => {
        const href = el.getAttribute("href")
        if (href)
          out.push(<link key={`link-${i}`} rel="stylesheet" href={href} />)
      })
    document.head.querySelectorAll("style").forEach((el, i) => {
      out.push(<style key={`style-${i}`}>{el.textContent ?? ""}</style>)
    })
    setNodes(out)
  }, [])

  return <>{nodes}</>
}

function TailwindInFrameExample() {
  const parentStyles = useDocumentStyles()

  return (
    <Frame
      style={{ width: "100%", height: 280 }}
      className="border-border rounded-md border"
      head={parentStyles}
    >
      <div className="bg-background text-foreground flex h-full items-center justify-center p-6">
        <div className="border-border bg-card rounded-lg border p-6 text-center shadow-sm">
          <h3 className="text-base font-semibold">Inside the Frame</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Same design-system utilities, fully isolated document.
          </p>
          <button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded-md px-4 py-2 text-sm font-medium"
          >
            Action
          </button>
        </div>
      </div>
    </Frame>
  )
}

function ExternalSiteExample() {
  return (
    <Frame
      src="https://example.com"
      title="example.com"
      style={{ width: "100%", height: 320 }}
      className="border-border rounded-md border bg-white"
    />
  )
}

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

      <ShowcaseExample
        title="Responsive viewport preview"
        code={`function ResponsiveViewportExample() {
  const [width, setWidth] = useState<"375" | "768" | "1280">("375")
  return (
    <>
      <ToggleGroup type="single" value={width} onValueChange={(v) => { if (v) setWidth(v as "375" | "768" | "1280") }}>
        <ToggleGroupItem value="375">Mobile · 375</ToggleGroupItem>
        <ToggleGroupItem value="768">Tablet · 768</ToggleGroupItem>
        <ToggleGroupItem value="1280">Desktop · 1280</ToggleGroupItem>
      </ToggleGroup>
      <Frame
        style={{ width: Number(width), maxWidth: "100%", height: 320 }}
        head={<style>{\`@media (min-width: 700px) { .layout { grid-template-columns: 200px 1fr; } } /* ... */\`}</style>}
      >
        <header>...</header>
        <div className="layout">...</div>
      </Frame>
    </>
  )
}

// The iframe has its own viewport, so internal @media queries react
// to the frame width directly — no JS observer needed.`}
      >
        <ResponsiveViewportExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Email template preview"
        code={`// Canonical email layout: nested <table> with inline styles. Frame
// renders it in an isolated document so the parent's stylesheets and
// resets can't interfere with the email HTML.
<Frame
  style={{ width: "100%", height: 520 }}
  head={<style>{\`body { margin: 0; background: #f3f4f6; font-family: -apple-system, sans-serif; }\`}</style>}
>
  <table width="100%" cellPadding={0} cellSpacing={0}>
    <tr><td align="center">
      <table width={560} style={{ background: "#fff", borderRadius: 8 }}>
        <tr><td style={{ background: "#4f46e5", color: "#fff", padding: "20px 24px" }}>Acme</td></tr>
        <tr><td style={{ padding: "32px 24px" }}>
          <h1>Welcome aboard, Jane</h1>
          <p>Thanks for signing up. Tap the button to verify your email.</p>
          <a href="#" style={{ background: "#4f46e5", color: "#fff", padding: "10px 18px", borderRadius: 6 }}>
            Verify email
          </a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</Frame>`}
      >
        <EmailTemplatePreviewExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Style isolation contrast"
        code={`// A wrapper applies an aggressive parent rule. The plain <div>
// descendant inherits it; the <Frame> sibling does not, because the
// iframe is its own document.
<div className="frame-aggressive-overrides">
  <style>{\`.frame-aggressive-overrides * {
    color: #dc2626 !important;
    font-family: "Comic Sans MS", cursive !important;
    text-transform: uppercase;
  }\`}</style>
  <div className="grid gap-4 md:grid-cols-2">
    <div>
      <h3>Welcome back</h3>
      <p>This content inherits the aggressive parent override.</p>
    </div>
    <Frame head={<style>{\`body { margin: 0; padding: 1rem; font-family: system-ui; }\`}</style>}>
      <h3>Welcome back</h3>
      <p>The same content inside the iframe is unaffected.</p>
    </Frame>
  </div>
</div>`}
      >
        <StyleIsolationContrastExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Design system inside the frame"
        code={`// Mirror the parent document's stylesheets into the iframe head so
// the design system's utilities and tokens work inside the isolated
// document. Use this when you want the frame for layout/style isolation
// but still need your component library available.

function useDocumentStyles(): ReactNode {
  const [nodes, setNodes] = useState<ReactNode[]>([])
  useEffect(() => {
    const out: ReactNode[] = []
    document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
      .forEach((el, i) => {
        const href = el.getAttribute("href")
        if (href) out.push(<link key={\`link-\${i}\`} rel="stylesheet" href={href} />)
      })
    document.head.querySelectorAll("style").forEach((el, i) => {
      out.push(<style key={\`style-\${i}\`}>{el.textContent ?? ""}</style>)
    })
    setNodes(out)
  }, [])
  return <>{nodes}</>
}

function TailwindInFrameExample() {
  const parentStyles = useDocumentStyles()
  return (
    <Frame style={{ width: "100%", height: 280 }} head={parentStyles}>
      <div className="bg-background text-foreground flex h-full items-center justify-center p-6">
        <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
          <h3 className="font-semibold">Inside the Frame</h3>
          <button className="bg-primary text-primary-foreground rounded-md px-4 py-2">Action</button>
        </div>
      </div>
    </Frame>
  )
}`}
      >
        <TailwindInFrameExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="External site (cross-origin src)"
        code={`// Frame extends iframe attributes, so passing src loads a remote
// document. The portal-rendered children path is skipped because
// cross-origin contentDocument access is blocked by the same-origin
// policy. Note: the target site must permit framing — sites that send
// X-Frame-Options: DENY or a restrictive Content-Security-Policy:
// frame-ancestors header will refuse to load.
<Frame
  src="https://example.com"
  title="example.com"
  style={{ width: "100%", height: 320 }}
/>`}
      >
        <ExternalSiteExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

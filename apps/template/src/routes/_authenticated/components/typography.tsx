import { createFileRoute } from "@tanstack/react-router"
import { Separator } from "@/core/components/ui/separator"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/typography")({
  component: TypographyPage,
})

function TypographyPage() {
  return (
    <ShowcasePage
      title="Typography"
      description="Text size scale, weight, color utilities, and font families applied via Tailwind CSS classes."
    >
      <ShowcaseExample
        title="Heading scale"
        code={`<h1 className="text-4xl font-bold">Heading 1 — 4xl bold</h1>
<h2 className="text-3xl font-semibold">Heading 2 — 3xl semibold</h2>
<h3 className="text-2xl font-semibold">Heading 3 — 2xl semibold</h3>
<h4 className="text-xl font-medium">Heading 4 — xl medium</h4>
<h5 className="text-lg font-medium">Heading 5 — lg medium</h5>
<h6 className="text-base font-medium">Heading 6 — base medium</h6>`}
      >
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">Heading 1 — 4xl bold</h1>
          <h2 className="text-3xl font-semibold">Heading 2 — 3xl semibold</h2>
          <h3 className="text-2xl font-semibold">Heading 3 — 2xl semibold</h3>
          <h4 className="text-xl font-medium">Heading 4 — xl medium</h4>
          <h5 className="text-lg font-medium">Heading 5 — lg medium</h5>
          <h6 className="text-base font-medium">Heading 6 — base medium</h6>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Body text and muted variants"
        code={`<p className="text-base">
  Body text at base size. Used for most paragraphs.
</p>
<p className="text-sm text-muted-foreground">
  Muted text at small size. Used for descriptions and supplementary info.
</p>
<p className="text-xs text-muted-foreground">
  Extra small text. Used for timestamps, labels, and metadata.
</p>`}
      >
        <div className="space-y-3">
          <p className="text-base">
            Body text at base size. Used for most paragraphs and readable
            content throughout the application.
          </p>
          <p className="text-muted-foreground text-sm">
            Muted text at small size. Used for descriptions, captions, and
            supplementary information.
          </p>
          <p className="text-muted-foreground text-xs">
            Extra small text. Used for timestamps, labels, and metadata.
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Font weights"
        code={`<p className="font-thin">Thin — font-thin</p>
<p className="font-light">Light — font-light</p>
<p className="font-normal">Normal — font-normal</p>
<p className="font-medium">Medium — font-medium</p>
<p className="font-semibold">Semibold — font-semibold</p>
<p className="font-bold">Bold — font-bold</p>
<p className="font-extrabold">Extra Bold — font-extrabold</p>`}
      >
        <div className="space-y-2">
          {[
            { label: "Thin — font-thin", cls: "font-thin" },
            { label: "Light — font-light", cls: "font-light" },
            { label: "Normal — font-normal", cls: "font-normal" },
            { label: "Medium — font-medium", cls: "font-medium" },
            { label: "Semibold — font-semibold", cls: "font-semibold" },
            { label: "Bold — font-bold", cls: "font-bold" },
            { label: "Extra Bold — font-extrabold", cls: "font-extrabold" },
          ].map(({ label, cls }) => (
            <p key={cls} className={cls}>
              {label}
            </p>
          ))}
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Monospace / code text"
        code={`<p className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
  const x = 42;
</p>

<code className="font-mono text-xs">
  npm install @tanstack/react-router
</code>`}
      >
        <div className="space-y-3">
          <p className="bg-muted inline-block rounded px-2 py-1 font-mono text-sm">
            const x = 42;
          </p>
          <div>
            <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
              npm install @tanstack/react-router
            </code>
          </div>
          <pre className="bg-muted rounded-md p-4">
            <code className="font-mono text-xs">{`function greet(name: string): string {
  return \`Hello, \${name}!\`
}`}</code>
          </pre>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Text colors"
        code={`<p className="text-foreground">text-foreground — primary text</p>
<p className="text-muted-foreground">text-muted-foreground — secondary text</p>
<p className="text-primary">text-primary — brand/action color</p>
<p className="text-destructive">text-destructive — error/warning</p>`}
      >
        <div className="space-y-2">
          <Separator className="mb-3" />
          <p className="text-foreground">
            text-foreground — primary text color
          </p>
          <p className="text-muted-foreground">
            text-muted-foreground — secondary / supporting text
          </p>
          <p className="text-primary">text-primary — brand or action color</p>
          <p className="text-destructive">
            text-destructive — error or danger state
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Text decoration and transform"
        code={`<p className="underline">Underlined text</p>
<p className="line-through">Strikethrough text</p>
<p className="uppercase tracking-widest text-xs">Uppercase small caps</p>
<p className="italic">Italic text</p>`}
      >
        <div className="space-y-2">
          <p className="underline">Underlined text</p>
          <p className="line-through">Strikethrough text</p>
          <p className="text-xs tracking-widest uppercase">
            Uppercase small caps
          </p>
          <p className="italic">Italic text</p>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

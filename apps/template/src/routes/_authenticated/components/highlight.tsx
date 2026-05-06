import { createFileRoute } from "@tanstack/react-router"
import { Highlight } from "darkraise-ui/components/highlight"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/highlight")({
  component: HighlightPage,
})

const SEARCH_RESULTS = [
  {
    title: "Getting started with darkraise-ui",
    excerpt:
      "Install darkraise-ui via npm or pnpm and import the styles to begin.",
  },
  {
    title: "Theming guide",
    excerpt:
      "Customize the darkraise palette using CSS variables and the theme engine.",
  },
  {
    title: "Component reference",
    excerpt:
      "Browse every component shipped with darkraise-ui and copy ready-to-use snippets.",
  },
]

function HighlightPage() {
  return (
    <ShowcasePage
      title="Highlight"
      description="Mark substrings inside a body of text with a literal-string matcher. Pure rendering — no state, no machine, just split-and-wrap."
    >
      <ShowcaseExample
        title="Search-result highlighting"
        code={`{results.map((result) => (
  <li key={result.title}>
    <p className="font-medium">
      <Highlight text={result.title} query="darkraise" />
    </p>
    <p className="text-muted-foreground text-sm">
      <Highlight text={result.excerpt} query="darkraise" />
    </p>
  </li>
))}`}
      >
        <ul className="space-y-3">
          {SEARCH_RESULTS.map((result) => (
            <li key={result.title}>
              <p className="font-medium">
                <Highlight text={result.title} query="darkraise" />
              </p>
              <p className="text-muted-foreground text-sm">
                <Highlight text={result.excerpt} query="darkraise" />
              </p>
            </li>
          ))}
        </ul>
      </ShowcaseExample>

      <ShowcaseExample
        title="Multi-term highlighting"
        code={`<Highlight
  text="The quick brown fox jumps over the lazy dog"
  query={["quick", "fox", "lazy"]}
/>`}
      >
        <p className="text-base leading-relaxed">
          <Highlight
            text="The quick brown fox jumps over the lazy dog"
            query={["quick", "fox", "lazy"]}
          />
        </p>
      </ShowcaseExample>

      <ShowcaseExample
        title="Case sensitivity comparison"
        code={`<Highlight text="Foo, foo and FOO walk into a bar" query="foo" />
<Highlight
  text="Foo, foo and FOO walk into a bar"
  query="foo"
  ignoreCase={false}
/>`}
      >
        <div className="space-y-3">
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              ignoreCase = true (default)
            </p>
            <p className="text-base">
              <Highlight text="Foo, foo and FOO walk into a bar" query="foo" />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
              ignoreCase = false
            </p>
            <p className="text-base">
              <Highlight
                text="Foo, foo and FOO walk into a bar"
                query="foo"
                ignoreCase={false}
              />
            </p>
          </div>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { FileX, PackageOpen, Search } from "lucide-react"
import { Button } from "darkraise-ui/components/button"
import { EmptyState } from "darkraise-ui/components/empty-state"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/empty-state")({
  component: EmptyStatePage,
})

function EmptyStatePage() {
  return (
    <ShowcasePage
      title="Empty State"
      description="A stateless primitive for telling people why a region has no content and what to do next."
    >
      <ShowcaseExample
        title="No results"
        code={`<EmptyState
  icon={<Search />}
  title="No matching results"
  description="We couldn't find anything for your query. Try a different search term."
  action={<Button variant="outline">Clear filters</Button>}
/>`}
      >
        <EmptyState
          icon={<Search />}
          title="No matching results"
          description="We couldn't find anything for your query. Try a different search term."
          action={<Button variant="outline">Clear filters</Button>}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Empty list"
        code={`<EmptyState
  icon={<PackageOpen />}
  title="Your library is empty"
  description="Items you create will appear in this list."
  action={<Button>Create project</Button>}
/>`}
      >
        <EmptyState
          icon={<PackageOpen />}
          title="Your library is empty"
          description="Items you create will appear in this list."
          action={<Button>Create project</Button>}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Generic blank"
        code={`<EmptyState
  title="Nothing to see here"
  description="This region has no content yet."
/>`}
      >
        <EmptyState
          title="Nothing to see here"
          description="This region has no content yet."
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Title only"
        code={`<EmptyState icon={<FileX />} title="No file selected" />`}
      >
        <EmptyState icon={<FileX />} title="No file selected" />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

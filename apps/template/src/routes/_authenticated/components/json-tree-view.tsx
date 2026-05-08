import { createFileRoute } from "@tanstack/react-router"
import { JsonTreeView } from "darkraise-ui/components/json-tree-view"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/json-tree-view",
)({
  component: JsonTreeViewPage,
})

const profile = {
  id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
  address: {
    street: "221B Baker Street",
    city: "London",
    country: "UK",
  },
  tags: ["admin", "active"],
}

const apiResponse = {
  status: 200,
  ok: true,
  data: {
    items: [
      { id: "a-1", title: "First", published: true, archivedAt: null },
      { id: "a-2", title: "Second", published: false, archivedAt: null },
    ],
    pagination: {
      page: 1,
      pageSize: 20,
      total: 2,
      hasMore: false,
    },
  },
  meta: {
    requestId: "req_abc123",
    durationMs: 42,
    cached: true,
  },
}

function JsonTreeViewPage() {
  return (
    <ShowcasePage
      title="JSON Tree View"
      description="A read-only viewer for nested JSON data. Each node is independently expandable, and rich types (null, booleans, arrays) get distinct visual treatment."
    >
      <ShowcaseExample
        title="User profile"
        code={`const profile = {
  id: 1,
  name: "Jane Doe",
  email: "jane@example.com",
  address: { street: "221B Baker Street", city: "London", country: "UK" },
  tags: ["admin", "active"],
}

<JsonTreeView data={profile} defaultExpandLevel={2} />`}
      >
        <JsonTreeView data={profile} defaultExpandLevel={2} />
      </ShowcaseExample>

      <ShowcaseExample
        title="API response with copy"
        code={`<JsonTreeView data={apiResponse} copyable defaultExpandLevel={1} />`}
      >
        <JsonTreeView data={apiResponse} copyable defaultExpandLevel={1} />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

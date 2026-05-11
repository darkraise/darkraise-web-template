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

const rich = {
  user: {
    id: 17,
    name: "Jane Doe",
    homepage: "https://example.com/profile/jane",
    avatar: "https://example.com/avatars/jane.png",
    brandColor: "#3b82f6",
    accentColor: "rgb(239, 68, 68)",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    tags: [],
    settings: {},
  },
  permissions: ["read", "write", "admin"],
  audit: {
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-11T15:30:00Z",
  },
}

function JsonTreeViewPage() {
  return (
    <ShowcasePage
      title="JSON Tree View"
      description="A read-only viewer for nested JSON data. Independently expandable rows, type-coloured values, search and expand-all toolbar, per-row Copy path and Copy value actions, container previews when collapsed, smart rendering for URLs and colours, and keyboard navigation."
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
        title="API response with copy actions"
        code={`{/* Each row gets hover-revealed Copy path / Copy value buttons. */}
<JsonTreeView data={apiResponse} copyable defaultExpandLevel={1} />`}
      >
        <JsonTreeView data={apiResponse} copyable defaultExpandLevel={1} />
      </ShowcaseExample>

      <ShowcaseExample
        title="Toolbar — search and expand controls"
        code={`{/* Type a substring to filter the tree; matching paths stay
   visible and matches get a primary-tinted highlight. The Expand and
   Collapse buttons toggle every container at once. */}
<JsonTreeView data={apiResponse} toolbar copyable defaultExpandLevel={1} />`}
      >
        <JsonTreeView
          data={apiResponse}
          toolbar
          copyable
          defaultExpandLevel={1}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Smart values — URLs, colours, long strings, empty containers"
        code={`{/* URLs render as clickable links, hex / rgb strings get a
   colour swatch, long strings collapse with a "more" toggle, and
   empty {} / [] render inline without an expand control. */}
<JsonTreeView data={rich} toolbar copyable defaultExpandLevel={3} />`}
      >
        <JsonTreeView data={rich} toolbar copyable defaultExpandLevel={3} />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { ScrollArea } from "@/core/components/ui/scroll-area"
import { Separator } from "@/core/components/ui/separator"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/scroll-area")({
  component: ScrollAreaPage,
})

const tags = [
  "Design",
  "Engineering",
  "Marketing",
  "Sales",
  "Product",
  "Finance",
  "HR",
  "Legal",
  "Operations",
  "Support",
  "Data",
  "Research",
]

function ScrollAreaPage() {
  return (
    <ShowcasePage
      title="Scroll Area"
      description="A scrollable container with a consistently styled custom scrollbar across platforms."
    >
      <ShowcaseExample
        title="Vertical scroll"
        code={`<ScrollArea className="h-48 rounded-md border border-border">
  <div className="space-y-2 p-4">
    {items.map((item, i) => (
      <div key={i} className="rounded-md bg-muted px-3 py-2 text-sm">
        {item}
      </div>
    ))}
  </div>
</ScrollArea>`}
      >
        <ScrollArea className="border-border h-48 rounded-md border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="bg-muted rounded-md px-3 py-2 text-sm">
                List item {i + 1} — scroll to see more content below
              </div>
            ))}
          </div>
        </ScrollArea>
      </ShowcaseExample>

      <ShowcaseExample
        title="Contact list with separators"
        code={`const contacts = [
  { name: "Alice Johnson", email: "alice@example.com" },
  // ...
]

<ScrollArea className="h-64 rounded-md border">
  <div className="p-4">
    <h4 className="mb-4 text-sm font-medium">Team Members</h4>
    {contacts.map((contact) => (
      <div key={contact.name}>
        <div className="py-2">
          <p className="text-sm font-medium">{contact.name}</p>
          <p className="text-xs text-muted-foreground">{contact.email}</p>
        </div>
        <Separator />
      </div>
    ))}
  </div>
</ScrollArea>`}
      >
        <ScrollArea className="border-border h-64 rounded-md border">
          <div className="p-4">
            <h4 className="mb-4 text-sm leading-none font-medium">
              Team Members
            </h4>
            {[
              {
                name: "Alice Johnson",
                email: "alice@example.com",
                dept: "Engineering",
              },
              { name: "Bob Smith", email: "bob@example.com", dept: "Design" },
              {
                name: "Carol White",
                email: "carol@example.com",
                dept: "Product",
              },
              {
                name: "David Lee",
                email: "david@example.com",
                dept: "Marketing",
              },
              {
                name: "Eva Chen",
                email: "eva@example.com",
                dept: "Engineering",
              },
              {
                name: "Frank Davis",
                email: "frank@example.com",
                dept: "Sales",
              },
              { name: "Grace Kim", email: "grace@example.com", dept: "HR" },
              {
                name: "Henry Park",
                email: "henry@example.com",
                dept: "Finance",
              },
            ].map((contact) => (
              <div key={contact.name}>
                <div className="py-2">
                  <p className="text-sm leading-none font-medium">
                    {contact.name}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {contact.email} · {contact.dept}
                  </p>
                </div>
                <Separator />
              </div>
            ))}
          </div>
        </ScrollArea>
      </ShowcaseExample>

      <ShowcaseExample
        title="Horizontal scroll"
        code={`<ScrollArea className="w-full whitespace-nowrap rounded-md border">
  <div className="flex gap-3 p-4">
    {tags.map((tag) => (
      <div key={tag} className="shrink-0 rounded-full bg-muted px-3 py-1 text-sm">
        {tag}
      </div>
    ))}
  </div>
</ScrollArea>`}
      >
        <ScrollArea className="border-border w-full rounded-md border whitespace-nowrap">
          <div className="flex gap-3 p-4">
            {tags.map((tag) => (
              <div
                key={tag}
                className="bg-muted shrink-0 rounded-full px-3 py-1 text-sm font-medium"
              >
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

import { createFileRoute } from "@tanstack/react-router"
import { Download } from "lucide-react"
import { DownloadTrigger } from "darkraise-ui/components/download-trigger"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute(
  "/_authenticated/components/download-trigger",
)({
  component: DownloadTriggerPage,
})

// Module-level constants — the Blob instances are static and don't need to
// be reallocated on every render of the page.
const TEXT_BLOB = new Blob(["Hello from Darkraise!\n"], { type: "text/plain" })
const JSON_BLOB = new Blob(
  [JSON.stringify({ hello: "world", count: 42 }, null, 2)],
  { type: "application/json" },
)

function DownloadTriggerPage() {
  return (
    <ShowcasePage
      title="Download Trigger"
      description="Button that downloads a Blob or string as a file. The component handles URL.createObjectURL + an anchor click + revocation so consumers only pass the data and a filename."
    >
      <ShowcaseExample
        title="Text and JSON"
        code={`const TEXT_BLOB = new Blob(["Hello from Darkraise!\\n"], {
  type: "text/plain",
})
const JSON_BLOB = new Blob(
  [JSON.stringify({ hello: "world", count: 42 }, null, 2)],
  { type: "application/json" },
)

<div className="flex flex-wrap gap-2">
  <DownloadTrigger data={TEXT_BLOB} fileName="hello.txt" variant="outline">
    <Download className="size-4" />
    Download text
  </DownloadTrigger>
  <DownloadTrigger
    data={JSON_BLOB}
    fileName="data.json"
    mimeType="application/json"
    variant="outline"
  >
    <Download className="size-4" />
    Download JSON
  </DownloadTrigger>
</div>`}
      >
        <div className="flex flex-wrap gap-2">
          <DownloadTrigger
            data={TEXT_BLOB}
            fileName="hello.txt"
            variant="outline"
          >
            <Download className="size-4" />
            Download text
          </DownloadTrigger>
          <DownloadTrigger
            data={JSON_BLOB}
            fileName="data.json"
            mimeType="application/json"
            variant="outline"
          >
            <Download className="size-4" />
            Download JSON
          </DownloadTrigger>
        </div>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

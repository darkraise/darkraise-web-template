import type { Meta, StoryObj } from "@storybook/react-vite"
import { Download } from "lucide-react"
import { DownloadTrigger } from "@components/download-trigger"

const meta: Meta<typeof DownloadTrigger> = {
  title: "UI/DownloadTrigger",
  component: DownloadTrigger,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof DownloadTrigger>

export const Default: Story = {
  render: () => (
    <DownloadTrigger
      fileName="hello.txt"
      data={new Blob(["Hello from DownloadTrigger!"], { type: "text/plain" })}
    >
      Download text
    </DownloadTrigger>
  ),
}

export const JsonFile: Story = {
  render: () => (
    <DownloadTrigger
      fileName="config.json"
      mimeType="application/json"
      data={JSON.stringify({ greeting: "hello", count: 3 }, null, 2)}
      variant="secondary"
    >
      Download config.json
    </DownloadTrigger>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <DownloadTrigger
      fileName="report.txt"
      data={new Blob(["report contents"], { type: "text/plain" })}
    >
      <Download aria-hidden="true" />
      Download report
    </DownloadTrigger>
  ),
}

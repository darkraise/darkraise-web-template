import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Banner } from "darkraise-ui/components/banner"
import { Button } from "darkraise-ui/components/button"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/banner")({
  component: BannerPage,
})

function DismissibleBannerExample() {
  const [visible, setVisible] = useState(true)
  return (
    <div className="space-y-3">
      {visible ? (
        <Banner variant="info" dismissible onDismiss={() => setVisible(false)}>
          A new version is available. Refresh to update.
        </Banner>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setVisible(true)}>
          Show banner
        </Button>
      )}
    </div>
  )
}

function BannerPage() {
  return (
    <ShowcasePage
      title="Banner"
      description="Full-width status messages. Five severity variants plus an optional dismissible mode."
    >
      <ShowcaseExample
        title="Variants"
        code={`<div className="flex flex-col gap-3">
  <Banner variant="default">Default — neutral status message.</Banner>
  <Banner variant="info">Info — informational notice.</Banner>
  <Banner variant="success">Success — operation completed.</Banner>
  <Banner variant="warning">Warning — review before continuing.</Banner>
  <Banner variant="destructive">Destructive — action failed.</Banner>
</div>`}
      >
        <div className="flex flex-col gap-3">
          <Banner variant="default">Default — neutral status message.</Banner>
          <Banner variant="info">Info — informational notice.</Banner>
          <Banner variant="success">Success — operation completed.</Banner>
          <Banner variant="warning">Warning — review before continuing.</Banner>
          <Banner variant="destructive">Destructive — action failed.</Banner>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Dismissible"
        code={`function DismissibleBannerExample() {
  const [visible, setVisible] = useState(true)
  return (
    <div className="space-y-3">
      {visible ? (
        <Banner variant="info" dismissible onDismiss={() => setVisible(false)}>
          A new version is available. Refresh to update.
        </Banner>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setVisible(true)}>
          Show banner
        </Button>
      )}
    </div>
  )
}`}
      >
        <DismissibleBannerExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}

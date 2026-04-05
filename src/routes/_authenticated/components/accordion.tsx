import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/core/layout"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/components/ui/accordion"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/accordion")({
  component: AccordionPage,
})

function AccordionPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Accordion" },
        ]}
        title="Accordion"
        description="Collapsible content sections for progressive disclosure of information."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title='type="single" — only one item open at a time'
          code={`<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>What is this component?</AccordionTrigger>
    <AccordionContent>
      An Accordion lets users show and hide sections of related content.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>When should I use it?</AccordionTrigger>
    <AccordionContent>
      Use for FAQs, settings panels, or progressive disclosure.
    </AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is this component?</AccordionTrigger>
              <AccordionContent>
                An Accordion lets users show and hide sections of related
                content on a page. Click any item to expand or collapse its
                content.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>When should I use it?</AccordionTrigger>
              <AccordionContent>
                Use accordions for FAQs, settings panels, or anywhere you want
                to progressively disclose information without requiring
                navigation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Can multiple items be open?</AccordionTrigger>
              <AccordionContent>
                With <code className="font-mono text-xs">type="multiple"</code>,
                yes. This example uses{" "}
                <code className="font-mono text-xs">type="single"</code> so only
                one item is open at a time.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ShowcaseExample>

        <ShowcaseExample
          title='type="multiple" — any number of items open simultaneously'
          code={`<Accordion type="multiple" className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>Section One</AccordionTrigger>
    <AccordionContent>Content for section one.</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Section Two</AccordionTrigger>
    <AccordionContent>Content for section two.</AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Section One</AccordionTrigger>
              <AccordionContent>
                Content for section one. With{" "}
                <code className="font-mono text-xs">type="multiple"</code> you
                can open this item independently of the others.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Section Two</AccordionTrigger>
              <AccordionContent>
                Content for section two. Both section one and two can be open at
                the same time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Section Three</AccordionTrigger>
              <AccordionContent>
                Content for section three. All three panels can be expanded
                simultaneously.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ShowcaseExample>

        <ShowcaseExample
          title="FAQ pattern"
          code={`<Accordion type="single" collapsible>
  {faqs.map(({ q, a }) => (
    <AccordionItem key={q} value={q}>
      <AccordionTrigger>{q}</AccordionTrigger>
      <AccordionContent>{a}</AccordionContent>
    </AccordionItem>
  ))}
</Accordion>`}
        >
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "How do I reset my password?",
                a: "Click 'Forgot password' on the login screen and follow the email instructions.",
              },
              {
                q: "Can I change my subscription plan?",
                a: "Yes — visit Settings > Billing to upgrade or downgrade at any time.",
              },
              {
                q: "Is my data encrypted?",
                a: "All data is encrypted at rest and in transit using AES-256 and TLS 1.3.",
              },
              {
                q: "How do I export my data?",
                a: "Go to Settings > Data and click Export. A download link will be sent to your email.",
              },
            ].map(({ q, a }) => (
              <AccordionItem key={q} value={q}>
                <AccordionTrigger>{q}</AccordionTrigger>
                <AccordionContent>{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ShowcaseExample>
      </div>
    </div>
  )
}

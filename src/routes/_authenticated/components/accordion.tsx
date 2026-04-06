import { createFileRoute } from "@tanstack/react-router"
import { CreditCard, Bell, Shield } from "lucide-react"
import { PageHeader } from "@/core/layout"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/core/components/ui/accordion"
import { Badge } from "@/core/components/ui/badge"
import { Label } from "@/core/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"
import { Switch } from "@/core/components/ui/switch"
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
        <ShowcaseExample
          title="Triggers with icons and badges"
          code={`<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="billing">
    <AccordionTrigger>
      <span className="flex flex-1 items-center gap-2">
        <CreditCard className="size-4 shrink-0" />
        Billing
      </span>
      <Badge variant="destructive" className="mr-2">3 issues</Badge>
    </AccordionTrigger>
    <AccordionContent>...</AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="billing">
              <AccordionTrigger>
                <span className="flex flex-1 items-center gap-2">
                  <CreditCard className="size-4 shrink-0" />
                  Billing
                </span>
                <Badge variant="destructive" className="mr-2">
                  3 issues
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                Your payment method has 3 outstanding issues. Please review your
                billing details and update your card information to avoid
                service interruption.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="notifications">
              <AccordionTrigger>
                <span className="flex flex-1 items-center gap-2">
                  <Bell className="size-4 shrink-0" />
                  Notifications
                </span>
                <Badge variant="secondary" className="mr-2">
                  12
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                You have 12 unread notifications. Configure your notification
                preferences to control which events send alerts and through
                which channels.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger>
                <span className="flex flex-1 items-center gap-2">
                  <Shield className="size-4 shrink-0" />
                  Security
                </span>
              </AccordionTrigger>
              <AccordionContent>
                Your account security looks good. Two-factor authentication is
                enabled and no suspicious login attempts have been detected in
                the last 30 days.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ShowcaseExample>

        <ShowcaseExample
          title="Nested accordion — hierarchical content"
          code={`<Accordion type="single" collapsible>
  <AccordionItem value="frontend">
    <AccordionTrigger>Frontend</AccordionTrigger>
    <AccordionContent>
      <Accordion type="multiple">
        <AccordionItem value="react">
          <AccordionTrigger>React</AccordionTrigger>
          <AccordionContent>A declarative UI library.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="frontend">
              <AccordionTrigger>Frontend</AccordionTrigger>
              <AccordionContent>
                <Accordion type="multiple" className="w-full pl-4">
                  <AccordionItem value="react">
                    <AccordionTrigger>React</AccordionTrigger>
                    <AccordionContent>
                      A declarative, component-based library for building user
                      interfaces. Maintained by Meta and a large open-source
                      community.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="vue">
                    <AccordionTrigger>Vue</AccordionTrigger>
                    <AccordionContent>
                      A progressive framework for building UIs, designed to be
                      incrementally adoptable with a gentle learning curve.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="angular">
                    <AccordionTrigger>Angular</AccordionTrigger>
                    <AccordionContent>
                      A full-featured, opinionated framework by Google offering
                      built-in tooling for routing, forms, and HTTP.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="backend">
              <AccordionTrigger>Backend</AccordionTrigger>
              <AccordionContent>
                Backend services handle data persistence, authentication, and
                business logic. Common choices include Node.js, Go, and Python
                frameworks such as FastAPI or Django.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ShowcaseExample>

        <ShowcaseExample
          title="Settings-style accordion with form controls"
          code={`<Accordion type="multiple">
  <AccordionItem value="notifications">
    <AccordionTrigger>Notifications</AccordionTrigger>
    <AccordionContent>
      <div className="flex items-center justify-between">
        <Label>Email notifications</Label>
        <Switch />
      </div>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="display">
    <AccordionTrigger>Display</AccordionTrigger>
    <AccordionContent>
      <Label htmlFor="theme-select">Theme</Label>
      <Select>
        <SelectTrigger id="theme-select">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="system">System</SelectItem>
        </SelectContent>
      </Select>
    </AccordionContent>
  </AccordionItem>
</Accordion>`}
        >
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="notifications">
              <AccordionTrigger>Notifications</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 py-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notif">Email notifications</Label>
                    <Switch id="email-notif" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notif">Push notifications</Label>
                    <Switch id="push-notif" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="display">
              <AccordionTrigger>Display</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 py-1">
                  <Label htmlFor="theme-select">Theme</Label>
                  <Select>
                    <SelectTrigger id="theme-select">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="privacy">
              <AccordionTrigger>Privacy</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="public-profile">Public profile</Label>
                  <Switch id="public-profile" defaultChecked />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ShowcaseExample>
      </div>
    </div>
  )
}

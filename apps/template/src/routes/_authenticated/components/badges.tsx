import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { CheckCircle, Clock, XCircle, AlertTriangle, X } from "lucide-react"
import { Badge } from "@/core/components/ui/badge"
import { Button } from "@/core/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/components/ui/table"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/badges")({
  component: BadgesPage,
})

function ClosableBadgesExample() {
  const [tags, setTags] = useState([
    "React",
    "TypeScript",
    "Tailwind",
    "Vite",
    "Radix",
  ])
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
          <Button
            variant="ghost"
            size="icon"
            className="ml-1 h-3 w-3"
            onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
    </div>
  )
}

function BadgesPage() {
  return (
    <ShowcasePage
      title="Badges"
      description="Compact inline labels for status, categories, and counts."
    >
      <ShowcaseExample
        title="Variants"
        code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}
      >
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="With icons"
        code={`<Badge variant="default">
  <CheckCircle className="mr-1 h-3 w-3" /> Active
</Badge>
<Badge variant="secondary">
  <Clock className="mr-1 h-3 w-3" /> Pending
</Badge>
<Badge variant="destructive">
  <XCircle className="mr-1 h-3 w-3" /> Failed
</Badge>
<Badge variant="outline">
  <AlertTriangle className="mr-1 h-3 w-3" /> Warning
</Badge>`}
      >
        <div className="flex flex-wrap gap-3">
          <Badge variant="default">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
          <Badge variant="outline">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Warning
          </Badge>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Numeric count badges"
        code={`<span className="relative inline-flex">
  <span>Notifications</span>
  <Badge className="ml-2">12</Badge>
</span>
<Badge variant="destructive">99+</Badge>
<Badge variant="outline">0</Badge>`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 text-sm">
            Notifications
            <Badge>12</Badge>
          </span>
          <span className="flex items-center gap-2 text-sm">
            Errors
            <Badge variant="destructive">99+</Badge>
          </span>
          <span className="flex items-center gap-2 text-sm">
            Unread
            <Badge variant="outline">0</Badge>
          </span>
          <span className="flex items-center gap-2 text-sm">
            Drafts
            <Badge variant="secondary">3</Badge>
          </span>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="In context — order status"
        code={`// Status badges used inline within list or table rows
<Badge variant="default">Delivered</Badge>
<Badge variant="secondary">Processing</Badge>
<Badge variant="outline">Draft</Badge>
<Badge variant="destructive">Cancelled</Badge>`}
      >
        <div className="space-y-3">
          {[
            { label: "Order #1042", status: "Delivered", variant: "default" },
            {
              label: "Order #1043",
              status: "Processing",
              variant: "secondary",
            },
            { label: "Order #1044", status: "Draft", variant: "outline" },
            {
              label: "Order #1045",
              status: "Cancelled",
              variant: "destructive",
            },
          ].map(({ label, status, variant }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-sm font-medium">{label}</span>
              <Badge
                variant={
                  variant as "default" | "secondary" | "outline" | "destructive"
                }
              >
                {status}
              </Badge>
            </div>
          ))}
        </div>
      </ShowcaseExample>
      <ShowcaseExample
        title="Closable badges"
        code={`const [tags, setTags] = useState(["React", "TypeScript", "Tailwind", "Vite", "Radix"])

{tags.map((tag) => (
  <Badge key={tag} variant="secondary">
    {tag}
    <Button
      variant="ghost"
      size="icon"
      className="ml-1 h-3 w-3"
      onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
    >
      <X className="h-3 w-3" />
    </Button>
  </Badge>
))}`}
      >
        <ClosableBadgesExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Animated pulse dot"
        code={`<div className="flex items-center gap-2">
  <div className="relative">
    <span className="h-2 w-2 rounded-full bg-green-500 block" />
    <span className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 opacity-75 animate-ping" />
  </div>
  <span className="text-sm">Live</span>
</div>
<div className="flex items-center gap-2">
  <span className="h-2 w-2 rounded-full bg-amber-500 block" />
  <span className="text-sm">Away</span>
</div>
<div className="flex items-center gap-2">
  <span className="h-2 w-2 rounded-full bg-gray-400 block" />
  <span className="text-sm">Offline</span>
</div>`}
      >
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="block h-2 w-2 rounded-full bg-green-500" />
              <span className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-green-500 opacity-75" />
            </div>
            <span className="text-sm">Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-sm">Away</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-sm">Offline</span>
          </div>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Badge list (tag cloud)"
        code={`<div className="flex flex-wrap gap-2">
  <Badge variant="default">JavaScript</Badge>
  <Badge variant="secondary">Design</Badge>
  <Badge variant="outline">Testing</Badge>
  <Badge variant="destructive">Security</Badge>
  <Badge variant="default">React</Badge>
  <Badge variant="secondary">Python</Badge>
  <Badge variant="outline">Docker</Badge>
  <Badge variant="secondary">CI/CD</Badge>
  <Badge variant="default">APIs</Badge>
  <Badge variant="outline">CSS</Badge>
  <Badge variant="secondary">Node.js</Badge>
  <Badge variant="default">SQL</Badge>
</div>`}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">JavaScript</Badge>
          <Badge variant="secondary">Design</Badge>
          <Badge variant="outline">Testing</Badge>
          <Badge variant="destructive">Security</Badge>
          <Badge variant="default">React</Badge>
          <Badge variant="secondary">Python</Badge>
          <Badge variant="outline">Docker</Badge>
          <Badge variant="secondary">CI/CD</Badge>
          <Badge variant="default">APIs</Badge>
          <Badge variant="outline">CSS</Badge>
          <Badge variant="secondary">Node.js</Badge>
          <Badge variant="default">SQL</Badge>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Badge in table context"
        code={`<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Task</TableHead>
      <TableHead>Priority</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Update API docs</TableCell>
      <TableCell><Badge variant="destructive">High</Badge></TableCell>
      <TableCell><Badge variant="outline">Done</Badge></TableCell>
    </TableRow>
    ...
  </TableBody>
</Table>`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Update API docs</TableCell>
              <TableCell>
                <Badge variant="destructive">High</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">Done</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Design system audit</TableCell>
              <TableCell>
                <Badge variant="default">Medium</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="default">In Progress</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Write onboarding guide</TableCell>
              <TableCell>
                <Badge variant="secondary">Low</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">To Do</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Fix login redirect bug</TableCell>
              <TableCell>
                <Badge variant="destructive">High</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">Done</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ShowcaseExample>
    </ShowcasePage>
  )
}

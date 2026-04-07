import { PageHeader } from "@/core/layout"

interface ShowcasePageProps {
  title: string
  description: string
  children: React.ReactNode
}

export function ShowcasePage({
  title,
  description,
  children,
}: ShowcasePageProps) {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: title },
        ]}
        title={title}
        description={description}
      />
      <div className="space-y-6">{children}</div>
    </div>
  )
}

import { PageHeader } from "darkraise-ui/layout"
import { useAppTranslation } from "@/i18n/useAppTranslation"

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
  const t = useAppTranslation()
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: t("Components"), href: "/components" },
          { label: title },
        ]}
        title={title}
        description={t(description)}
      />
      <div className="space-y-6">{children}</div>
    </div>
  )
}

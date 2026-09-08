import { useAppTranslation } from "@/i18n/useAppTranslation"
import { Card, CardContent } from "darkraise-ui/components/card"
import { FormSection } from "darkraise-ui/forms"
import { ThemeSettingsPanel } from "darkraise-ui/theme"

export function AppearanceSection() {
  const t = useAppTranslation()

  return (
    <FormSection
      title={t("Appearance")}
      description={t("These settings apply immediately and persist locally.")}
    >
      <Card>
        <CardContent className="pt-6">
          <ThemeSettingsPanel layout="page" />
        </CardContent>
      </Card>
    </FormSection>
  )
}

import { FieldSet, FieldLegend, FieldGroup } from "@components/field"
import type { FormSectionProps } from "@forms/types"

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <FieldSet>
      <FieldLegend>{title}</FieldLegend>
      {description && (
        <p className="dr-form-section-description">{description}</p>
      )}
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  )
}
